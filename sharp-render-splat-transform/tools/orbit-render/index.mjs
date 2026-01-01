#!/usr/bin/env node

import { parseArgs } from 'node:util';
import { mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { existsSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec, execSync } from 'node:child_process';
import { promisify } from 'node:util';

import puppeteer from 'puppeteer';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));

const usage = `
Splat Orbit Render - Render orbit sequences from PLY files
==========================================================

USAGE
  node index.mjs <input.ply> [OPTIONS]

OPTIONS
  -o, --output <dir>           Output directory for frames (default: ./frames)
  -f, --frames <n>             Number of frames (default: 36)
  -r, --radius <n>             Camera orbit radius (default: 5)
  -w, --width <n>              Image width (default: 1920)
  -H, --img-height <n>         Image height (default: 1080)
  --fov <n>                    Camera FOV in degrees (default: 50)
  --target <x,y,z>             Camera target point (default: 0,0,0)
  --start-angle <n>            Start angle in degrees (default: 0)
  --swing-angle <n>            Swing angle range in degrees (default: 30, e.g., -15 to 15)
  --cleanup                    Clean up temporary files after rendering
  -q, --quiet                  Suppress non-error output
  --help                       Show this help and exit

EXAMPLES
  # Render 36 frames (360 degrees) with default settings
  node index.mjs input.ply

  # Render 72 frames with custom radius and output directory
  node index.mjs input.ply -f 72 -r 10 -o ./my_frames

  # Render with custom image size and camera height
  node index.mjs input.ply -w 3840 -H 2160 -h 3

  # Render with custom target point
  node index.mjs input.ply --target 0,1,0
`;

const parseOptions = () => {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      output: { type: 'string', short: 'o', default: './frames' },
      frames: { type: 'string', short: 'f', default: '36' },
      radius: { type: 'string', short: 'r', default: '2' },
      width: { type: 'string', short: 'w', default: '1920' },
      'img-height': { type: 'string', short: 'H', default: '1080' },
      fov: { type: 'string', default: '50' },
      target: { type: 'string', short: 't', default: '0,0,0' },
      'start-angle': { type: 'string', default: '0' },
      'swing-angle': { type: 'string', default: '30' },
      cleanup: { type: 'boolean', default: false },
      quiet: { type: 'boolean', short: 'q', default: false },
      help: { type: 'boolean', default: false }
    }
  });

  if (values.help || positionals.length === 0) {
    console.log(usage);
    process.exit(values.help ? 0 : 1);
  }

  const parseNumber = (value, name) => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      console.error(`Invalid ${name}: ${value}`);
      process.exit(1);
    }
    return num;
  };

  const parseVec3 = (value) => {
    const parts = value.split(',').map(v => parseFloat(v.trim()));
    if (parts.length !== 3 || parts.some(isNaN)) {
      console.error(`Invalid vector: ${value}`);
      process.exit(1);
    }
    return parts;
  };

  return {
    inputFile: resolve(positionals[0]),
    outputDir: resolve(values.output),
    frames: parseInt(values.frames, 10),
    radius: parseNumber(values.radius, 'radius'),
    width: parseInt(values.width, 10),
    height: parseInt(values['img-height'], 10),
    fov: parseNumber(values.fov, 'fov'),
    target: parseVec3(values.target),
    startAngle: parseNumber(values['start-angle'], 'start-angle'),
    swingAngle: parseNumber(values['swing-angle'], 'swing-angle'),
    cleanup: values.cleanup,
    quiet: values.quiet
  };
};

const log = (message, quiet) => {
  if (!quiet) {
    console.log(`[INFO] ${message}`);
  }
};

const logError = (message) => {
  console.error(`[ERROR] ${message}`);
};

const generateViewerHtml = async (plyFile, options) => {
  const tempDir = join(dirname(options.outputDir), '.temp_splat_render');
  
  if (!existsSync(tempDir)) {
    await mkdir(tempDir, { recursive: true });
  }

  const htmlFile = join(tempDir, 'viewer.html');
  const settingsFile = join(tempDir, 'settings.json');

  const halfSwingAngle = options.swingAngle / 2;
  const settings = {
    camera: {
      fov: options.fov,
      position: [0, 0, 0],
      target: [0, 0, 0],
      startAnim: 'animTrack'
    },
    background: {
      color: [0, 0, 0]
    },
    animTracks: [
      {
        name: 'Orbit Track',
        duration: 1,
        frameRate: 30,
        loopMode: 'loop',
        interpolation: 'linear',
        smoothness: 0,
        keyframes: {
            times: [0, 1],
            values: {
              position: [
                [
                  options.radius * Math.sin((-halfSwingAngle * Math.PI) / 180),
                  0,
                  options.radius * Math.cos((-halfSwingAngle * Math.PI) / 180) - options.radius
                ],
                [
                  options.radius * Math.sin((halfSwingAngle * Math.PI) / 180),
                  0,
                  options.radius * Math.cos((halfSwingAngle * Math.PI) / 180) - options.radius
                ]
              ],
            target: [[0, 0, 0], [0, 0, 0]],
            fov: [options.fov, options.fov]
          }
        }
      }
    ]
  };

  const settingsJson = JSON.stringify(settings, null, 2);
  
  writeFileSync(settingsFile, settingsJson, 'utf-8');
  
  try {
    execSync(`splat-transform -w "${plyFile}" "${htmlFile}" -E "${settingsFile}"`, {
      stdio: options.quiet ? 'pipe' : 'inherit'
    });
  } catch (error) {
    logError(`Failed to generate HTML viewer: ${error.message}`);
    throw error;
  }

  await addDefaultCameraScript(htmlFile);
  await disableCameraUpdate(htmlFile);

  return { htmlFile, tempDir };
};

const addDefaultCameraScript = async (htmlPath) => {
  const html = await readFile(htmlPath, 'utf-8');
  
  const defaultCameraScript = `
    (function() {
      const setDefaultCamera = () => {
        const cameraElement = document.querySelector('pc-entity[name="camera"]');
        if (cameraElement && cameraElement.entity) {
          const camera = cameraElement.entity;
          camera.setLocalPosition(0, 0, 0);
          camera.setLocalEulerAngles(
            (180 * Math.PI) / 180,
            (0 * Math.PI) / 180,
            (180 * Math.PI) / 180
          );
          console.log('Default camera position and rotation set');
        } else {
          setTimeout(setDefaultCamera, 500);
        }
      };
      
      setTimeout(setDefaultCamera, 2000);
    })();
  `;

  let modifiedHtml = html;
  
  const scriptEnd = '</script>';
  const lastScriptEndIndex = modifiedHtml.lastIndexOf(scriptEnd);
  if (lastScriptEndIndex !== -1) {
    modifiedHtml = modifiedHtml.substring(0, lastScriptEndIndex) + defaultCameraScript + scriptEnd + modifiedHtml.substring(lastScriptEndIndex + scriptEnd.length);
  }
  
  await writeFile(htmlPath, modifiedHtml, 'utf-8');
};

const disableCameraUpdate = async (htmlPath) => {
  const html = await readFile(htmlPath, 'utf-8');
  
  const modifiedHtml = html.replace(
    /app\.on\('update', \(deltaTime\) => \{[\s\S]*?applyCamera\(this\.cameraManager\.camera\);[\s\S]*?\}\);/,
    `app.on('update', (deltaTime) => {\n            // in xr mode we leave the camera alone\n            if (app.xr.active) {\n                return;\n            }\n            if (this.inputController && this.cameraManager && !window.disableCameraUpdate) {\n                // update inputs\n                this.inputController.update(deltaTime, this.cameraManager.camera.distance);\n                // update cameras\n                this.cameraManager.update(deltaTime, this.inputController.frame);\n                // apply to the camera entity\n                applyCamera(this.cameraManager.camera);\n            }\n        });`
  );
  
  await writeFile(htmlPath, modifiedHtml, 'utf-8');
};

const renderOrbitSequence = async (options) => {
  const { htmlFile, tempDir } = await generateViewerHtml(options.inputFile, options);

  log(`Launching browser...`, options.quiet);

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    protocolTimeout: 120000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--enable-webgl',
      '--enable-gpu-rasterization',
      '--enable-zero-copy'
    ]
  });

  const page = await browser.newPage();
  
  await page.setViewport({
    width: options.width,
    height: options.height,
    deviceScaleFactor: 1
  });

  log(`Loading viewer...`, options.quiet);
  await page.goto(`file://${htmlFile}`, { waitUntil: 'networkidle0', timeout: 60000 });

  log(`Waiting for scene to load...`, options.quiet);
  
  await page.waitForSelector('canvas', { timeout: 30000 });
  
  await new Promise(resolve => setTimeout(resolve, 5000));

  log(`Starting render sequence (${options.frames} frames)...`, options.quiet);

  const halfSwingAngle = options.swingAngle / 2;
  const startAngle = -halfSwingAngle;
  const endAngle = halfSwingAngle;
  const radius = options.radius;

  for (let i = 0; i < options.frames; i++) {
    const angleDeg = startAngle + (i / (options.frames - 1)) * (endAngle - startAngle);
    const angleRad = (angleDeg * Math.PI) / 180;
    
    const cameraX = radius * Math.sin(angleRad);
    const cameraY = 0;
    const cameraZ = radius * Math.cos(angleRad) - radius;
    
    const rotationX = 180;
    const rotationY = angleDeg;
    const rotationZ = 180;
    
    await page.evaluate((x, y, z, rotX, rotY, rotZ) => {
      const cameraElement = document.querySelector('pc-entity[name="camera"]');
      if (cameraElement && cameraElement.entity) {
        const camera = cameraElement.entity;
        camera.setLocalPosition(x, y, z);
        camera.setLocalEulerAngles(rotX, rotY, rotZ);
      }
      
      window.disableCameraUpdate = true;
    }, cameraX, cameraY, cameraZ, rotationX, rotationY, rotationZ);

    const frameNumber = String(i).padStart(3, '0');
    const outputPath = join(options.outputDir, `frame_${frameNumber}.png`);

    await page.screenshot({
      path: outputPath,
      type: 'png',
      clip: null
    });

    if (!options.quiet && (i + 1) % 10 === 0) {
      log(`Rendered ${i + 1}/${options.frames} frames`, options.quiet);
    }
  }

  log(`Rendering complete!`, options.quiet);

  await browser.close();

  if (options.cleanup) {
    log(`Cleaning up temporary files...`, options.quiet);
    await rm(tempDir, { recursive: true, force: true });
  }

  return tempDir;
};

const main = async () => {
  const options = parseOptions();

  log(`Splat Orbit Render v1.0.0`, options.quiet);
  log(`Input file: ${options.inputFile}`, options.quiet);
  log(`Output directory: ${options.outputDir}`, options.quiet);
  log(`Frames: ${options.frames}`, options.quiet);
  log(`Radius: ${options.radius}`, options.quiet);
  log(`Image size: ${options.width}x${options.height}`, options.quiet);
  log(``, options.quiet);

  if (!existsSync(options.inputFile)) {
    logError(`Input file not found: ${options.inputFile}`);
    process.exit(1);
  }

  await mkdir(options.outputDir, { recursive: true });

  try {
    await renderOrbitSequence(options);
    log(`Done! Frames saved to: ${options.outputDir}`, options.quiet);
  } catch (error) {
    logError(`Rendering failed: ${error.message}`);
    process.exit(1);
  }
};

main();

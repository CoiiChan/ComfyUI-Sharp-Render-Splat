import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const setDefaultCameraRotation = async (htmlPath) => {
  const html = await readFile(htmlPath, 'utf-8');
  
  const defaultCameraScript = `
    (function() {
      const setDefaultCamera = () => {
        const cameraElement = document.querySelector('pc-entity[name="camera"]');
        if (cameraElement && cameraElement.entity) {
          const camera = cameraElement.entity;
          camera.setPosition(0, 0, 0);
          camera.setEulerAngles(
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
  console.log(`Default camera rotation set to (180, 0, 180) in ${htmlPath}`);
};

const htmlPath = process.argv[2];
if (!htmlPath) {
  console.log('Usage: node set-default-camera.mjs <html-file>');
  process.exit(1);
}

setDefaultCameraRotation(resolve(htmlPath)).catch(console.error);

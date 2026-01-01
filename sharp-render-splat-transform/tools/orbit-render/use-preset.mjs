#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const presets = JSON.parse(readFileSync('./presets.json', 'utf-8'));

const generateCommand = (inputFile, presetName, outputDir, additionalOptions = {}) => {
  const preset = presets.presets[presetName];
  
  if (!preset) {
    console.error(`Preset not found: ${presetName}`);
    console.log(`Available presets: ${Object.keys(presets.presets).join(', ')}`);
    process.exit(1);
  }

  let command = `node index.mjs "${inputFile}"`;
  
  if (outputDir) {
    command += ` -o "${outputDir}"`;
  }
  
  if (preset.frames) command += ` -f ${preset.frames}`;
  if (preset.width) command += ` -w ${preset.width}`;
  if (preset.height) command += ` -H ${preset.height}`;
  if (preset.radius) command += ` -r ${preset.radius}`;
  if (preset.cameraHeight) command += ` -h ${preset.cameraHeight}`;
  if (preset.fov) command += ` --fov ${preset.fov}`;
  if (preset.target) command += ` --target ${preset.target.join(',')}`;
  
  Object.entries(additionalOptions).forEach(([key, value]) => {
    if (key === 'cleanup' && value) {
      command += ' --cleanup';
    } else if (key === 'quiet' && value) {
      command += ' -q';
    } else if (key === 'startAngle') {
      command += ` --start-angle ${value}`;
    }
  });

  return command;
};

const main = () => {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node use-preset.mjs <input.ply> <preset-name> [output-dir] [options]

Available presets:
${Object.entries(presets.presets).map(([name, preset]) => 
  `  ${name.padEnd(15)} - ${preset.description}`
).join('\n')}

Examples:
  node use-preset.mjs model.ply quick_preview ./preview
  node use-preset.mjs model.ply standard ./frames --cleanup
  node use-preset.mjs model.ply high_quality ./output --start-angle 45

Additional options:
  --cleanup        Clean up temporary files after rendering
  --quiet          Suppress non-error output
  --start-angle <n> Start angle in degrees
`);
    process.exit(0);
  }

  const inputFile = args[0];
  const presetName = args[1];
  const outputDir = args[2];
  
  const additionalOptions = {
    cleanup: args.includes('--cleanup'),
    quiet: args.includes('--quiet'),
    startAngle: args.find(arg => arg.startsWith('--start-angle'))?.split('=')[1]
  };

  const command = generateCommand(inputFile, presetName, outputDir, additionalOptions);
  
  console.log(`Generated command:\n`);
  console.log(command);
  console.log(`\nTo execute, run:\n`);
  console.log(`  ${command}`);
};

main();

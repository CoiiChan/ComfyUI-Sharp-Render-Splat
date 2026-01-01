#!/usr/bin/env node

import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

console.log('Splat Orbit Render - Quick Start Guide');
console.log('======================================\n');

const checkRequirements = () => {
  console.log('Checking requirements...\n');

  let allGood = true;

  if (!existsSync(resolve('./node_modules/puppeteer'))) {
    console.log('❌ Puppeteer not installed. Run: npm install');
    allGood = false;
  } else {
    console.log('✅ Puppeteer installed');
  }

  try {
    const { execSync } = require('node:child_process');
    execSync('splat-transform --version', { stdio: 'pipe' });
    console.log('✅ splat-transform CLI available');
  } catch (error) {
    console.log('❌ splat-transform CLI not found. Run: npm install -g @playcanvas/splat-transform');
    allGood = false;
  }

  return allGood;
};

const showExamples = () => {
  console.log('\nUsage Examples:\n');
  console.log('1. Basic usage (36 frames, default settings):');
  console.log('   node index.mjs input.ply\n');
  console.log('2. Custom output directory:');
  console.log('   node index.mjs input.ply -o ./my_frames\n');
  console.log('3. High quality (72 frames, 4K resolution):');
  console.log('   node index.mjs input.ply -f 72 -w 3840 -H 2160\n');
  console.log('4. Custom camera settings:');
  console.log('   node index.mjs input.ply -r 10 -h 3 --target 0,1,0\n');
  console.log('5. Quick preview (18 frames, 720p):');
  console.log('   node index.mjs input.ply -f 18 -w 1280 -H 720\n');
  console.log('6. With cleanup:');
  console.log('   node index.mjs input.ply --cleanup\n');
  console.log('7. Show all options:');
  console.log('   node index.mjs --help\n');
};

const main = () => {
  if (checkRequirements()) {
    console.log('\n✅ All requirements met!\n');
    showExamples();
    console.log('\nReady to render! 🚀\n');
  } else {
    console.log('\n❌ Please install missing dependencies first.\n');
    process.exit(1);
  }
};

main();

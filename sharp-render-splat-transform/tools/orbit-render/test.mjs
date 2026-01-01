#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

console.log('Splat Orbit Render - Test Script');
console.log('================================\n');

const testCases = [
  {
    name: 'Quick Preview',
    description: '18 frames, 720p, fast rendering',
    command: 'node index.mjs test.ply -f 18 -w 1280 -H 720 -r 3 -o ./test_output/quick_preview'
  },
  {
    name: 'Standard Quality',
    description: '36 frames, 1080p, balanced quality',
    command: 'node index.mjs test.ply -f 36 -w 1920 -H 1080 -r 5 -o ./test_output/standard'
  },
  {
    name: 'High Quality',
    description: '72 frames, 1080p, smooth animation',
    command: 'node index.mjs test.ply -f 72 -w 1920 -H 1080 -r 8 -o ./test_output/high_quality'
  },
  {
    name: 'Top Down View',
    description: '36 frames, top-down orbit',
    command: 'node index.mjs test.ply -f 36 -h 10 -r 5 -o ./test_output/top_down'
  },
  {
    name: 'Close Up',
    description: '72 frames, close-up view',
    command: 'node index.mjs test.ply -f 72 -r 2 -h 1 --target 0,0.5,0 -o ./test_output/close_up'
  }
];

const runTest = (testCase) => {
  console.log(`\nRunning: ${testCase.name}`);
  console.log(`Description: ${testCase.description}`);
  console.log(`Command: ${testCase.command}`);
  console.log('---');

  try {
    execSync(testCase.command, { stdio: 'inherit' });
    console.log(`✅ ${testCase.name} completed successfully`);
  } catch (error) {
    console.log(`❌ ${testCase.name} failed`);
    console.log(`Error: ${error.message}`);
  }
};

const main = () => {
  if (!existsSync('./test.ply')) {
    console.log('❌ Test file not found: test.ply');
    console.log('\nPlease provide a PLY file named "test.ply" in the current directory,');
    console.log('or modify the test cases in this script to use your own file.');
    process.exit(1);
  }

  console.log('Found test file: test.ply\n');
  console.log('Available test cases:\n');

  testCases.forEach((testCase, index) => {
    console.log(`${index + 1}. ${testCase.name}`);
    console.log(`   ${testCase.description}`);
  });

  console.log('\n---\n');
  console.log('To run all tests, press Enter');
  console.log('To run a specific test, enter the test number (1-5)');
  console.log('To exit, press Ctrl+C\n');

  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (input) => {
    const choice = input.trim();

    if (choice === '') {
      console.log('\nRunning all tests...\n');
      testCases.forEach(runTest);
    } else {
      const index = parseInt(choice) - 1;
      if (index >= 0 && index < testCases.length) {
        runTest(testCases[index]);
      } else {
        console.log('Invalid choice. Please enter a number between 1 and 5.');
      }
    }

    console.log('\n---\n');
    console.log('Test run complete!');
    console.log('Output files are in ./test_output/\n');
    process.exit(0);
  });
};

main();

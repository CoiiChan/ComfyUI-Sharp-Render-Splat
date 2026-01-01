import puppeteer from 'puppeteer';
import { resolve } from 'node:path';

const testCameraInfo = async (htmlPath) => {
  console.log(`Testing camera info display in: ${htmlPath}`);
  
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`Browser console: ${msg.text()}`);
  });
  
  try {
    await page.goto(`file://${resolve(htmlPath)}`, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    console.log('Page loaded, waiting for camera info to initialize...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const cameraInfo = await page.evaluate(() => {
      const posX = document.getElementById('cam-pos-x');
      const posY = document.getElementById('cam-pos-y');
      const posZ = document.getElementById('cam-pos-z');
      const rotX = document.getElementById('cam-rot-x');
      const rotY = document.getElementById('cam-rot-y');
      const rotZ = document.getElementById('cam-rot-z');
      
      return {
        position: {
          x: posX ? posX.textContent : 'N/A',
          y: posY ? posY.textContent : 'N/A',
          z: posZ ? posZ.textContent : 'N/A'
        },
        rotation: {
          x: rotX ? rotX.textContent : 'N/A',
          y: rotY ? rotY.textContent : 'N/A',
          z: rotZ ? rotZ.textContent : 'N/A'
        }
      };
    });
    
    console.log('\n=== Camera Info ===');
    console.log('Position:');
    console.log(`  X: ${cameraInfo.position.x}`);
    console.log(`  Y: ${cameraInfo.position.y}`);
    console.log(`  Z: ${cameraInfo.position.z}`);
    console.log('Rotation:');
    console.log(`  X: ${cameraInfo.rotation.x}`);
    console.log(`  Y: ${cameraInfo.rotation.y}`);
    console.log(`  Z: ${cameraInfo.rotation.z}`);
    
    const hasValidData = Object.values(cameraInfo.position).every(v => v !== '0.0000' && v !== 'N/A') ||
                        Object.values(cameraInfo.rotation).every(v => v !== '0.0000' && v !== 'N/A');
    
    if (hasValidData) {
      console.log('\n✓ Camera info is displaying valid data!');
    } else {
      console.log('\n✗ Camera info is not displaying valid data yet');
    }
    
    console.log('\nBrowser will remain open for manual testing...');
    console.log('Press Ctrl+C to close the browser and exit.');
    
    await new Promise(resolve => {
      process.on('SIGINT', resolve);
    });
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
};

const htmlPath = process.argv[2];
if (!htmlPath) {
  console.log('Usage: node test-camera-info.mjs <html-file>');
  process.exit(1);
}

testCameraInfo(resolve(htmlPath)).catch(console.error);

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const addCameraInfo = async (htmlPath) => {
  const html = await readFile(htmlPath, 'utf-8');
  
  const cameraInfoStyle = `
    #camera-info {
      position: fixed;
      top: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      z-index: 1000;
      min-width: 280px;
      pointer-events: none;
    }
    #camera-info h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #4CAF50;
      border-bottom: 1px solid #444;
      padding-bottom: 5px;
    }
    #camera-info .info-row {
      display: flex;
      justify-content: space-between;
      margin: 5px 0;
    }
    #camera-info .label {
      color: #888;
    }
    #camera-info .value {
      color: #fff;
      font-weight: bold;
    }
    #camera-info .section {
      margin: 10px 0;
      padding-top: 10px;
      border-top: 1px solid #444;
    }
  `;

  const cameraInfoHtml = `
    <div id="camera-info">
      <h3>Camera Info</h3>
      <div class="section">
        <div class="info-row">
          <span class="label">Position X:</span>
          <span class="value" id="cam-pos-x">0.0000</span>
        </div>
        <div class="info-row">
          <span class="label">Position Y:</span>
          <span class="value" id="cam-pos-y">0.0000</span>
        </div>
        <div class="info-row">
          <span class="label">Position Z:</span>
          <span class="value" id="cam-pos-z">0.0000</span>
        </div>
      </div>
      <div class="section">
        <div class="info-row">
          <span class="label">Rotation X:</span>
          <span class="value" id="cam-rot-x">0.0000</span>
        </div>
        <div class="info-row">
          <span class="label">Rotation Y:</span>
          <span class="value" id="cam-rot-y">0.0000</span>
        </div>
        <div class="info-row">
          <span class="label">Rotation Z:</span>
          <span class="value" id="cam-rot-z">0.0000</span>
        </div>
      </div>
    </div>
  `;

  const cameraInfoScript = `
    (function() {
      const updateCameraInfo = () => {
        const cameraElement = document.querySelector('pc-entity[name="camera"]');
        if (cameraElement && cameraElement.entity) {
          const camera = cameraElement.entity;
          const posX = document.getElementById('cam-pos-x');
          const posY = document.getElementById('cam-pos-y');
          const posZ = document.getElementById('cam-pos-z');
          const rotX = document.getElementById('cam-rot-x');
          const rotY = document.getElementById('cam-rot-y');
          const rotZ = document.getElementById('cam-rot-z');
          
          if (camera.getPosition) {
            const pos = camera.getPosition();
            if (posX) posX.textContent = pos.x.toFixed(4);
            if (posY) posY.textContent = pos.y.toFixed(4);
            if (posZ) posZ.textContent = pos.z.toFixed(4);
          }
          
          if (camera.getEulerAngles) {
            const rot = camera.getEulerAngles();
            if (rotX) rotX.textContent = rot.x.toFixed(4);
            if (rotY) rotY.textContent = rot.y.toFixed(4);
            if (rotZ) rotZ.textContent = rot.z.toFixed(4);
          }
        } else {
          console.log('Camera element not found or not ready');
        }
        requestAnimationFrame(updateCameraInfo);
      };
      
      setTimeout(updateCameraInfo, 3000);
    })();
  `;

  let modifiedHtml = html;
  
  const styleEnd = '</style>';
  const styleEndIndex = modifiedHtml.indexOf(styleEnd);
  if (styleEndIndex !== -1) {
    modifiedHtml = modifiedHtml.substring(0, styleEndIndex) + cameraInfoStyle + styleEnd + modifiedHtml.substring(styleEndIndex + styleEnd.length);
  }
  
  const bodyStart = '<body>';
  const bodyStartIndex = modifiedHtml.indexOf(bodyStart);
  if (bodyStartIndex !== -1) {
    modifiedHtml = modifiedHtml.substring(0, bodyStartIndex + bodyStart.length) + cameraInfoHtml + modifiedHtml.substring(bodyStartIndex + bodyStart.length);
  }
  
  const scriptEnd = '</script>';
  const lastScriptEndIndex = modifiedHtml.lastIndexOf(scriptEnd);
  if (lastScriptEndIndex !== -1) {
    modifiedHtml = modifiedHtml.substring(0, lastScriptEndIndex) + cameraInfoScript + scriptEnd + modifiedHtml.substring(lastScriptEndIndex + scriptEnd.length);
  }
  
  await writeFile(htmlPath, modifiedHtml, 'utf-8');
  console.log(`Camera info added to ${htmlPath}`);
};

const htmlPath = process.argv[2];
if (!htmlPath) {
  console.log('Usage: node add-camera-info.mjs <html-file>');
  process.exit(1);
}

addCameraInfo(resolve(htmlPath)).catch(console.error);

import { readFile, writeFile } from 'fs/promises';

const disableCameraUpdate = async (htmlPath) => {
  const html = await readFile(htmlPath, 'utf-8');
  
  const modifiedHtml = html.replace(
    /app\.on\('update', \(deltaTime\) => \{[\s\S]*?applyCamera\(this\.cameraManager\.camera\);[\s\S]*?\}\);/,
    `app.on('update', (deltaTime) => {
            // in xr mode we leave the camera alone
            if (app.xr.active) {
                return;
            }
            if (this.inputController && this.cameraManager && !window.disableCameraUpdate) {
                // update inputs
                this.inputController.update(deltaTime, this.cameraManager.camera.distance);
                // update cameras
                this.cameraManager.update(deltaTime, this.inputController.frame);
                // apply to the camera entity
                applyCamera(this.cameraManager.camera);
            }
        });`
  );
  
  await writeFile(htmlPath, modifiedHtml, 'utf-8');
  console.log('Camera update disabled in HTML viewer');
};

const htmlPath = process.argv[2];
if (!htmlPath) {
  console.error('Usage: node disable-camera-update.mjs <html-path>');
  process.exit(1);
}

disableCameraUpdate(htmlPath).catch(console.error);
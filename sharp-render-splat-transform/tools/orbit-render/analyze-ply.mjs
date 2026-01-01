import { open } from 'node:fs/promises';

const analyzePly = async (plyPath) => {
  const file = await open(plyPath, 'r');
  
  const headerBuf = Buffer.alloc(128 * 1024);
  const { bytesRead } = await file.read(headerBuf, 0, 128 * 1024);
  
  const headerText = headerBuf.toString('utf-8', 0, bytesRead);
  const headerEnd = headerText.indexOf('end_header');
  
  if (headerEnd === -1) {
    console.log('Could not find end_header in PLY file');
    await file.close();
    return;
  }
  
  const header = headerText.substring(0, headerEnd);
  console.log('=== PLY Header ===');
  console.log(header);
  console.log('=== End of Header ===\n');
  
  const vertexMatch = header.match(/element vertex (\d+)/);
  if (!vertexMatch) {
    console.log('Not a valid PLY file');
    await file.close();
    return;
  }
  
  const numVertices = parseInt(vertexMatch[1]);
  console.log(`Number of vertices: ${numVertices}`);
  
  const propertyMatches = header.match(/property float (\w+)/g);
  const properties = propertyMatches ? propertyMatches.map(m => m.replace('property float ', '')) : [];
  console.log(`Properties: ${properties.join(', ')}`);
  
  const xIdx = properties.indexOf('x');
  const yIdx = properties.indexOf('y');
  const zIdx = properties.indexOf('z');
  
  if (xIdx === -1 || yIdx === -1 || zIdx === -1) {
    console.log('PLY file does not contain x, y, z properties');
    await file.close();
    return;
  }
  
  console.log(`X index: ${xIdx}, Y index: ${yIdx}, Z index: ${zIdx}`);
  
  const vertexSize = properties.length * 4;
  const headerSize = headerEnd + 'end_header\n'.length;
  
  console.log(`Vertex size: ${vertexSize} bytes`);
  console.log(`Header size: ${headerSize} bytes`);
  
  console.log(`\n=== Reading vertex coordinates...`);
  
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  
  const batchSize = 10000;
  const totalBatches = Math.ceil(numVertices / batchSize);
  
  for (let batch = 0; batch < totalBatches; batch++) {
    const startVertex = batch * batchSize;
    const endVertex = Math.min(startVertex + batchSize, numVertices);
    const vertexCount = endVertex - startVertex;
    
    const offset = headerSize + startVertex * vertexSize;
    const bufferSize = vertexCount * vertexSize;
    
    const buf = Buffer.alloc(bufferSize);
    await file.read(buf, 0, bufferSize, offset);
    
    for (let i = 0; i < vertexCount; i++) {
      const vertexOffset = i * vertexSize;
      const x = buf.readFloatLE(vertexOffset + xIdx * 4);
      const y = buf.readFloatLE(vertexOffset + yIdx * 4);
      const z = buf.readFloatLE(vertexOffset + zIdx * 4);
      
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }
    
    if (batch % 10 === 0) {
      console.log(`Processed batch ${batch + 1}/${totalBatches} (${endVertex}/${numVertices} vertices)`);
    }
  }
  
  console.log(`\n=== Bounding Box ===`);
  console.log(`X: [${minX.toFixed(6)}, ${maxX.toFixed(6)}] (range: ${(maxX - minX).toFixed(6)})`);
  console.log(`Y: [${minY.toFixed(6)}, ${maxY.toFixed(6)}] (range: ${(maxY - minY).toFixed(6)})`);
  console.log(`Z: [${minZ.toFixed(6)}, ${maxZ.toFixed(6)}] (range: ${(maxZ - minZ).toFixed(6)})`);
  
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;
  
  console.log(`\n=== Center Point ===`);
  console.log(`Center: (${centerX.toFixed(6)}, ${centerY.toFixed(6)}, ${centerZ.toFixed(6)})`);
  
  const sizeX = maxX - minX;
  const sizeY = maxY - minY;
  const sizeZ = maxZ - minZ;
  const maxDim = Math.max(sizeX, sizeY, sizeZ);
  
  console.log(`\n=== Dimensions ===`);
  console.log(`Size: (${sizeX.toFixed(6)}, ${sizeY.toFixed(6)}, ${sizeZ.toFixed(6)})`);
  console.log(`Max dimension: ${maxDim.toFixed(6)}`);
  
  const isCenteredAtOrigin = Math.abs(centerX) < 0.01 && Math.abs(centerY) < 0.01 && Math.abs(centerZ) < 0.01;
  
  console.log(`\n=== Analysis ===`);
  if (isCenteredAtOrigin) {
    console.log(`✓ Point cloud IS centered at origin (0, 0, 0)`);
  } else {
    console.log(`✗ Point cloud is NOT centered at origin`);
    console.log(`  Offset from origin: (${centerX.toFixed(6)}, ${centerY.toFixed(6)}, ${centerZ.toFixed(6)})`);
  }
  
  console.log(`\n=== Camera Positioning Recommendation ===`);
  console.log(`For orbit radius of 1, recommended camera positions:`);
  console.log(`  +X: (${(centerX + 1).toFixed(6)}, ${centerY.toFixed(6)}, ${centerZ.toFixed(6)})`);
  console.log(`  -X: (${(centerX - 1).toFixed(6)}, ${centerY.toFixed(6)}, ${centerZ.toFixed(6)})`);
  console.log(`  +Y: (${centerX.toFixed(6)}, ${(centerY + 1).toFixed(6)}, ${centerZ.toFixed(6)})`);
  console.log(`  -Y: (${centerX.toFixed(6)}, ${(centerY - 1).toFixed(6)}, ${centerZ.toFixed(6)})`);
  console.log(`  +Z: (${centerX.toFixed(6)}, ${centerY.toFixed(6)}, ${(centerZ + 1).toFixed(6)})`);
  console.log(`  -Z: (${centerX.toFixed(6)}, ${centerY.toFixed(6)}, ${(centerZ - 1).toFixed(6)})`);
  
  await file.close();
};

const plyPath = process.argv[2];
if (!plyPath) {
  console.log('Usage: node analyze-ply.mjs <ply-file>');
  process.exit(1);
}

analyzePly(plyPath).catch(console.error);

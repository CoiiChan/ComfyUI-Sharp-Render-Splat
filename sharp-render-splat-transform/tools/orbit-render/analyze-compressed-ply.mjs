import { open } from 'node:fs/promises';

const CHUNK_SIZE = 256;

const unpackUnorm = (value, bits) => {
  const t = (1 << bits) - 1;
  return (value & t) / t;
};

const unpack111011 = (value) => ({
  x: unpackUnorm(value >>> 21, 11),
  y: unpackUnorm(value >>> 11, 10),
  z: unpackUnorm(value, 11)
});

const lerp = (a, b, t) => a * (1 - t) + b * t;

const analyzeCompressedPly = async (plyPath) => {
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
  
  const chunkMatch = header.match(/element chunk (\d+)/);
  if (!chunkMatch) {
    console.log('Not a compressed PLY file');
    await file.close();
    return;
  }
  
  const numChunks = parseInt(chunkMatch[1]);
  console.log(`Number of chunks: ${numChunks}`);
  
  const headerSize = headerEnd + 'end_header\n'.length;
  console.log(`Header size: ${headerSize} bytes`);
  
  const chunkElementSize = 18 * 4;
  const vertexElementSize = 4 * 4;
  
  const chunkDataOffset = headerSize;
  const vertexDataOffset = headerSize + numChunks * chunkElementSize;
  
  console.log(`Chunk data offset: ${chunkDataOffset} bytes`);
  console.log(`Vertex data offset: ${vertexDataOffset} bytes`);
  
  console.log(`\n=== Reading chunk data...`);
  
  const chunkBuf = Buffer.alloc(numChunks * chunkElementSize);
  await file.read(chunkBuf, 0, chunkBuf.length, chunkDataOffset);
  
  const min_x = new Float32Array(numChunks);
  const max_x = new Float32Array(numChunks);
  const min_y = new Float32Array(numChunks);
  const max_y = new Float32Array(numChunks);
  const min_z = new Float32Array(numChunks);
  const max_z = new Float32Array(numChunks);
  
  for (let i = 0; i < numChunks; i++) {
    const offset = i * chunkElementSize;
    min_x[i] = chunkBuf.readFloatLE(offset);
    min_y[i] = chunkBuf.readFloatLE(offset + 4);
    min_z[i] = chunkBuf.readFloatLE(offset + 8);
    max_x[i] = chunkBuf.readFloatLE(offset + 12);
    max_y[i] = chunkBuf.readFloatLE(offset + 16);
    max_z[i] = chunkBuf.readFloatLE(offset + 20);
  }
  
  console.log(`Chunk data read complete`);
  
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
    
    const offset = vertexDataOffset + startVertex * vertexElementSize;
    const bufferSize = vertexCount * vertexElementSize;
    
    const buf = Buffer.alloc(bufferSize);
    await file.read(buf, 0, bufferSize, offset);
    
    for (let i = 0; i < vertexCount; i++) {
      const vertexOffset = i * vertexElementSize;
      const packedPos = buf.readUInt32LE(vertexOffset);
      
      const ci = Math.floor((startVertex + i) / CHUNK_SIZE);
      
      const p = unpack111011(packedPos);
      
      const x = lerp(min_x[ci], max_x[ci], p.x);
      const y = lerp(min_y[ci], max_y[ci], p.y);
      const z = lerp(min_z[ci], max_z[ci], p.z);
      
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
  
  console.log(`\n=== Recommended Target Point ===`);
  console.log(`Target: (${centerX.toFixed(6)}, ${centerY.toFixed(6)}, ${centerZ.toFixed(6)})`);
  
  await file.close();
};

const plyPath = process.argv[2];
if (!plyPath) {
  console.log('Usage: node analyze-compressed-ply.mjs <ply-file>');
  process.exit(1);
}

analyzeCompressedPly(plyPath).catch(console.error);

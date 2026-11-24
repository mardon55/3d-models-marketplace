const sharp = require('sharp');
const path = require('path');

async function run() {
  const inputPath = 'C:/Users/mardonbek/.gemini/antigravity/brain/f0ad5794-b1e9-49b2-ade8-c7c83c679418/.user_uploaded/media_1795425222330_90cba155.jpg';
  const { data, info } = await sharp(inputPath).raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  function getExpectedBg(x, y) {
    const dx = (x - 510) / 510;
    const dy = (y - 160) / 180;
    const dist = Math.min(1, Math.sqrt(dx * dx * 0.7 + dy * dy));
    const r = 55 - 23 * dist;
    const g = 60 - 24 * dist;
    const b = 68 - 26 * dist;
    return [r, g, b];
  }

  function isBg(idx) {
    const x = idx % width;
    const y = Math.floor(idx / width);
    const r = data[idx * 3];
    const g = data[idx * 3 + 1];
    const b = data[idx * 3 + 2];

    const [er, eg, eb] = getExpectedBg(x, y);
    const diff = Math.sqrt((r - er)**2 + (g - eg)**2 + (b - eb)**2);
    return diff < 16;
  }

  const mask = new Uint8Array(width * height);
  mask.fill(255);

  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0, tail = 0;

  function push(x, y) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    visited[idx] = 1;
    if (isBg(idx)) {
      mask[idx] = 0;
      queue[tail++] = idx;
    }
  }

  for (let x = 0; x < width; x++) { push(x, 0); push(x, height - 1); }
  for (let y = 0; y < height; y++) { push(0, y); push(width - 1, y); }

  while (head < tail) {
    const curr = queue[head++];
    const cx = curr % width;
    const cy = Math.floor(curr / width);

    const neighbors = [
      [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1],
      [cx + 1, cy + 1], [cx - 1, cy - 1], [cx + 1, cy - 1], [cx - 1, cy + 1]
    ];
    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = ny * width + nx;
        if (!visited[nIdx]) {
          visited[nIdx] = 1;
          if (isBg(nIdx)) {
            mask[nIdx] = 0;
            queue[tail++] = nIdx;
          }
        }
      }
    }
  }

  const finalMask = new Uint8Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (mask[idx] === 0) {
        finalMask[idx] = 0;
      } else {
        let bgNeighbors = 0;
        if (mask[idx - 1] === 0) bgNeighbors++;
        if (mask[idx + 1] === 0) bgNeighbors++;
        if (mask[idx - width] === 0) bgNeighbors++;
        if (mask[idx + width] === 0) bgNeighbors++;
        if (bgNeighbors === 0) finalMask[idx] = 255;
        else if (bgNeighbors === 1) finalMask[idx] = 210;
        else if (bgNeighbors === 2) finalMask[idx] = 140;
        else finalMask[idx] = 70;
      }
    }
  }

  const outBuf = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    outBuf[i * 4] = data[i * 3];
    outBuf[i * 4 + 1] = data[i * 3 + 1];
    outBuf[i * 4 + 2] = data[i * 3 + 2];
    outBuf[i * 4 + 3] = finalMask[i];
  }

  const outputPath = path.join(__dirname, '../public/assets/models/ak47.png');
  const distPath = path.join(__dirname, '../dist/assets/models/ak47.png');
  const m4a1PublicPath = path.join(__dirname, '../public/assets/models/m4a1.png');
  const m4a1DistPath = path.join(__dirname, '../dist/assets/models/m4a1.png');

  // Convert raw buffer to PNG with trim and resize
  await sharp(outBuf, { raw: { width, height, channels: 4 } })
    .trim({ threshold: 5 })
    .resize({ width: 384, height: 432, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ quality: 100 })
    .toFile(outputPath);

  require('fs').copyFileSync(outputPath, distPath);
  require('fs').copyFileSync(outputPath, m4a1PublicPath);
  require('fs').copyFileSync(outputPath, m4a1DistPath);

  console.log('AK-47 thumbnail generated and updated everywhere successfully!');
}

run().catch(console.error);

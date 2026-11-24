const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function fix() {
  const inputPath = 'C:/Users/mardonbek/.gemini/antigravity/brain/f0ad5794-b1e9-49b2-ade8-c7c83c679418/.user_uploaded/media_1795425222330_90cba155.jpg';
  const { data, info } = await sharp(inputPath).raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  const mask = new Uint8Array(width * height);
  // Default: outside bounding box is completely transparent (0)
  // Inside bounding box starts as 255 (opaque)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (y < 102 || y > 298 || x < 104 || x > 938) {
        mask[idx] = 0;
      } else {
        mask[idx] = 255;
      }
    }
  }

  // Inside bounding box, flood fill transparent pixels from top/bottom/left/right boundaries
  // A pixel is background if it has typical background blue-grey color:
  // r in [28, 62], g in [32, 68], b in [38, 76] and b >= g && g >= r && (b - r) >= 4
  function isBgPixel(x, y) {
    const idx = y * width + x;
    const r = data[idx * 3];
    const g = data[idx * 3 + 1];
    const b = data[idx * 3 + 2];
    
    // Background is dark blue-grey with b >= g >= r
    if (r >= 24 && r <= 65 && g >= 28 && g <= 72 && b >= 34 && b <= 80) {
      if (b >= g && g >= r - 2 && (b - r) >= 4) {
        return true;
      }
    }
    return false;
  }

  // Queue for BFS
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0, tail = 0;

  // Seed boundary pixels of the bounding box
  for (let x = 104; x <= 938; x++) {
    for (let y of [102, 103, 297, 298]) {
      const idx = y * width + x;
      if (!visited[idx] && isBgPixel(x, y)) {
        visited[idx] = 1;
        mask[idx] = 0;
        queue[tail++] = idx;
      }
    }
  }
  for (let y = 102; y <= 298; y++) {
    for (let x of [104, 105, 937, 938]) {
      const idx = y * width + x;
      if (!visited[idx] && isBgPixel(x, y)) {
        visited[idx] = 1;
        mask[idx] = 0;
        queue[tail++] = idx;
      }
    }
  }

  while (head < tail) {
    const curr = queue[head++];
    const cx = curr % width;
    const cy = Math.floor(curr / width);

    const neighbors = [
      [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]
    ];
    for (const [nx, ny] of neighbors) {
      if (nx >= 104 && nx <= 938 && ny >= 102 && ny <= 298) {
        const nIdx = ny * width + nx;
        if (!visited[nIdx]) {
          visited[nIdx] = 1;
          if (isBgPixel(nx, ny)) {
            mask[nIdx] = 0;
            queue[tail++] = nIdx;
          }
        }
      }
    }
  }

  // Build RGBA output
  const outBuf = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    outBuf[i * 4] = data[i * 3];
    outBuf[i * 4 + 1] = data[i * 3 + 1];
    outBuf[i * 4 + 2] = data[i * 3 + 2];
    outBuf[i * 4 + 3] = mask[i];
  }

  const outputPath = path.join(__dirname, '../public/assets/models/ak47.png');
  const distPath = path.join(__dirname, '../dist/assets/models/ak47.png');
  const m4a1PublicPath = path.join(__dirname, '../public/assets/models/m4a1.png');
  const m4a1DistPath = path.join(__dirname, '../dist/assets/models/m4a1.png');

  await sharp(outBuf, { raw: { width, height, channels: 4 } })
    .trim({ threshold: 5 })
    .resize({ width: 384, height: 432, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ quality: 100 })
    .toFile(outputPath);

  fs.copyFileSync(outputPath, distPath);
  fs.copyFileSync(outputPath, m4a1PublicPath);
  fs.copyFileSync(outputPath, m4a1DistPath);

  console.log('Fixed AK-47 image generated successfully without any triangles!');
}

fix().catch(console.error);

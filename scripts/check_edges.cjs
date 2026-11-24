const fs = require('fs');
const path = require('path');
const { readPNG } = require('./find_blemish.cjs');

const dir = 'public/assets/models';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));

for (const file of files) {
  const img = readPNG(fs.readFileSync(path.join(dir, file)));
  console.log('\n=== FILE:', file);
  // Find all components (clusters of non-transparent pixels)
  // Or check if there are small disconnected islands (artifacts)
  const visited = new Uint8Array(img.width * img.height);
  const islands = [];
  
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const idx = y * img.width + x;
      if (visited[idx]) continue;
      const a = img.pixels[idx * 4 + 3];
      if (a < 15) {
        visited[idx] = 1;
        continue;
      }
      
      // BFS to find connected component
      let q = [x, y];
      visited[idx] = 1;
      let minX = x, maxX = x, minY = y, maxY = y;
      let pixelCount = 0;
      let qHead = 0;
      
      while (qHead < q.length) {
        const cx = q[qHead++];
        const cy = q[qHead++];
        pixelCount++;
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;
        
        const neighbors = [
          [cx + 1, cy], [cx - 1, cy],
          [cx, cy + 1], [cx, cy - 1]
        ];
        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < img.width && ny >= 0 && ny < img.height) {
            const nIdx = ny * img.width + nx;
            if (!visited[nIdx]) {
              visited[nIdx] = 1;
              if (img.pixels[nIdx * 4 + 3] >= 15) {
                q.push(nx, ny);
              }
            }
          }
        }
      }
      
      islands.push({ count: pixelCount, bbox: [minX, maxX, minY, maxY] });
    }
  }
  
  // Sort islands by count descending
  islands.sort((a, b) => b.count - a.count);
  console.log(`Total components: ${islands.length}`);
  console.log('Main component count:', islands[0]?.count, 'bbox:', islands[0]?.bbox);
  if (islands.length > 1) {
    console.log('Small islands (artifacts?):', islands.slice(1, 10));
  }
}

import fs from 'node:fs';
import path from 'node:path';

let totalOrig = 0;
let totalCard = 0;
const heavyList = [];

const content = fs.readFileSync('src/data/models.ts', 'utf8');
const matches = content.matchAll(/"glbUrl":\s*"([^"]+)"/g);
const urls = [];
for (const m of matches) urls.push(m[1]);

urls.forEach(url => {
  const origPath = path.join('public', url.replace(/^\//, ''));
  const cardPath = path.join('public', url.replace(/^\//, '').replace(/\.glb$/, '_card.glb'));
  if (fs.existsSync(origPath) && fs.existsSync(cardPath)) {
    const sOrig = fs.statSync(origPath).size / 1024 / 1024;
    const sCard = fs.statSync(cardPath).size / 1024 / 1024;
    totalOrig += sOrig;
    totalCard += sCard;
    if (sOrig > 8.0) {
      heavyList.push({
        file: path.basename(origPath),
        origMB: sOrig.toFixed(2),
        cardMB: sCard.toFixed(2),
        saved: ((1 - sCard / sOrig) * 100).toFixed(1) + '%'
      });
    }
  }
});

console.log('Total models analyzed:', urls.length);
console.log('Total original size:', totalOrig.toFixed(2), 'MB');
console.log('Total card size:', totalCard.toFixed(2), 'MB');
console.log('Total bandwidth saved:', ((1 - totalCard / totalOrig) * 100).toFixed(1) + '%');
console.log('--- Top Heavy Models (Before vs After) ---');
console.table(heavyList);

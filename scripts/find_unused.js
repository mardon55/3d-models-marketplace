import fs from 'fs';

const content = fs.readFileSync('src/data/models.ts', 'utf8');
const usedGlbs = new Set();
const matches = content.matchAll(/glbUrl["']?:\s*["']([^"']+)["']/g);
for (const m of matches) {
  usedGlbs.add(m[1]);
}

console.log('Total used GLBs in models.ts:', usedGlbs.size);

['binolar', 'harbiy', 'mashinalar', 'qurollar'].forEach(c => {
  const dir = 'public/models/' + c;
  fs.readdirSync(dir).forEach(f => {
    if (f.endsWith('.glb') && !f.endsWith('_card.glb')) {
      const url = '/models/' + c + '/' + f;
      if (!usedGlbs.has(url)) {
        console.log('Unused GLB:', url);
      }
    }
  });
});

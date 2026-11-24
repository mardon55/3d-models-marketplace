import fs from 'fs';

const content = fs.readFileSync('src/data/models.ts', 'utf8');
const lines = content.split('\n');
let current = {};
const items = [];

for (const line of lines) {
  const mId = line.match(/"id":\s*"([^"]+)"/);
  if (mId) current.id = mId[1];
  const mName = line.match(/"name":\s*"([^"]+)"/);
  if (mName) current.name = mName[1];
  const mGlb = line.match(/"glbUrl":\s*"([^"]+)"/);
  if (mGlb) current.glbUrl = mGlb[1];
  const mCat = line.match(/"category":\s*"([^"]+)"/);
  if (mCat) current.category = mCat[1];
  if (line.trim() === '},' || line.trim() === '}') {
    if (current.id) {
      items.push({ ...current });
      current = {};
    }
  }
}

console.log('Parsed items count:', items.length);
const withoutGlb = items.filter(x => !x.glbUrl);
console.log('Without glbUrl count:', withoutGlb.length);
console.log('Without glbUrl items:', withoutGlb);

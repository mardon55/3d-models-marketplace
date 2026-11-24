import fs from 'node:fs';

const content = fs.readFileSync('src/data/models.ts', 'utf8');

// Parse products
const lines = content.split('\n');
let current = {};
const rawProducts = [];
let insideProducts = false;
let headerLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('export const products: Product[] = [')) {
    insideProducts = true;
    continue;
  }
  if (!insideProducts) {
    headerLines.push(line);
    continue;
  }
  if (line.trim() === 'export const categories: ModelCategory[] = [' || line.startsWith('export const categories')) {
    insideProducts = false;
    break;
  }

  const mId = line.match(/"id":\s*"([^"]+)"/);
  if (mId) current.id = mId[1];
  const mName = line.match(/"name":\s*"([^"]+)"/);
  if (mName) current.name = mName[1];
  const mSize = line.match(/"size":\s*"([^"]+)"/);
  if (mSize) current.size = mSize[1];
  const mPrice = line.match(/"price":\s*([0-9.]+)/);
  if (mPrice) current.price = parseFloat(mPrice[1]);
  const mCat = line.match(/"category":\s*"([^"]+)"/);
  if (mCat) current.category = mCat[1];
  const mGlb = line.match(/"glbUrl":\s*"([^"]+)"/);
  if (mGlb) current.glbUrl = mGlb[1];
  const mDesc = line.match(/"description":\s*"([^"]+)"/);
  if (mDesc) current.description = mDesc[1];
  const mPolys = line.match(/"polygons":\s*"([^"]+)"/);
  if (mPolys) current.polygons = mPolys[1];
  const mVerts = line.match(/"vertices":\s*"([^"]+)"/);
  if (mVerts) current.vertices = mVerts[1];
  const mAuthor = line.match(/"author":\s*"([^"]+)"/);
  if (mAuthor) current.author = mAuthor[1];

  if (line.trim() === '},' || line.trim() === '}') {
    if (current.id) {
      rawProducts.push({ ...current });
      current = {};
    }
  }
}

console.log('Read', rawProducts.length, 'raw products');

// Mapping for the 6 mock products to 6 real vehicles
const mockReplacements = {
  mercedes: {
    id: 'car-kit-suv-luxury',
    name: 'Lyuks shahar SUV',
    size: '0.4 MB',
    price: 12.99,
    category: 'Transport',
    polygons: '3,200',
    vertices: '2,800',
    glbUrl: '/models/mashinalar/037_car-kit_suv-luxury.glb',
    description: "Zamonaviy shahar uchun mo'ljallangan qulay va shinam lyuks toifadagi SUV avtomobili 3D modeli."
  },
  villa: {
    id: 'car-kit-police',
    name: 'Politsiya patrul avtomobili',
    size: '0.4 MB',
    price: 14.99,
    category: 'Transport',
    polygons: '3,400',
    vertices: '2,900',
    glbUrl: '/models/mashinalar/032_car-kit_police.glb',
    description: "Maxsus xizmat patrul politsiya avtomobili 3D modeli. Mayoqchalar va to'liq jihozlar bilan."
  },
  chair: {
    id: 'car-kit-firetruck',
    name: "O't o'chirish mashinasi",
    size: '0.5 MB',
    price: 15.99,
    category: 'Transport',
    polygons: '4,100',
    vertices: '3,600',
    glbUrl: '/models/mashinalar/024_car-kit_firetruck.glb',
    description: "Katta sig'imli shahar yong'in qutqaruv xizmati avtomobili 3D modeli."
  },
  container: {
    id: 'car-kit-taxi',
    name: 'Shahar taksi avtomobili',
    size: '0.4 MB',
    price: 11.99,
    category: 'Transport',
    polygons: '3,100',
    vertices: '2,700',
    glbUrl: '/models/mashinalar/039_car-kit_taxi.glb',
    description: "Sariq rangdagi klassik shahar yo'lovchi taksi avtomobili 3D modeli."
  },
  sofa: {
    id: 'car-kit-van',
    name: 'Yetkazib berish furgoni',
    size: '0.4 MB',
    price: 13.49,
    category: 'Transport',
    polygons: '3,300',
    vertices: '2,900',
    glbUrl: '/models/mashinalar/045_car-kit_van.glb',
    description: "Tijorat yuklarini va posilkalarni yetkazib berish uchun qulay ixcham furgon."
  },
  'steel-beams': {
    id: 'car-kit-ambulance',
    name: 'Tez tibbiy yordam mashinasi',
    size: '0.4 MB',
    price: 14.49,
    category: 'Transport',
    polygons: '3,500',
    vertices: '3,000',
    glbUrl: '/models/mashinalar/021_car-kit_ambulance.glb',
    description: "Shoshilinch tibbiy yordam ko'rsatish maxsus reanimatsiya mashinasi 3D modeli."
  }
};

const finalProducts = rawProducts.map(p => {
  if (mockReplacements[p.id]) {
    p = { ...p, ...mockReplacements[p.id] };
  }
  const glbUrl = p.glbUrl;
  const cardGlbUrl = glbUrl ? glbUrl.replace(/\.glb$/, '_card.glb') : '';
  return {
    id: p.id,
    name: p.name,
    size: p.size || '1.0 MB',
    price: p.price || 9.99,
    image: '', // Rule 1: No preview images!
    category: p.category || 'Boshqa',
    polygons: p.polygons || '10,000',
    vertices: p.vertices || '8,000',
    format: 'GLB / Three.js 3D',
    textures: 'PBR',
    has3D: true,
    glbUrl: glbUrl,
    cardGlbUrl: cardGlbUrl,
    author: p.author,
    description: p.description || ''
  };
});

console.log('Final products count:', finalProducts.length);

// Category counts
const catCounts = {};
finalProducts.forEach(p => {
  catCounts[p.category] = (catCounts[p.category] || 0) + 1;
});
console.log('Category breakdown:', catCounts);

const output = `export type Product = {
  id: string
  name: string
  size: string
  price: number
  image: string
  category?: string
  description?: string
  polygons?: string
  vertices?: string
  format?: string
  textures?: string
  has3D?: boolean
  glbUrl: string
  cardGlbUrl: string
  author?: string
}

export type CartLine = Product & { quantity: number }

export type ModelCategory = {
  name: string
  count: number
  image: string
  icon: 'car' | 'house' | 'plane' | 'target'
}

export const products: Product[] = ${JSON.stringify(finalProducts, null, 2)}

export const categories: ModelCategory[] = [
  {
    "name": "Transport",
    "count": ${catCounts['Transport'] || 0},
    "image": "",
    "icon": "car"
  },
  {
    "name": "Qurollar",
    "count": ${catCounts['Qurollar'] || 0},
    "image": "",
    "icon": "target"
  },
  {
    "name": "Binolar",
    "count": ${catCounts['Binolar'] || 0},
    "image": "",
    "icon": "house"
  },
  {
    "name": "Harbiy texnika",
    "count": ${catCounts['Harbiy texnika'] || 0},
    "image": "",
    "icon": "plane"
  }
]

export const initialCart: CartLine[] = []
`;

fs.writeFileSync('src/data/models.ts', output, 'utf8');
console.log('Successfully written src/data/models.ts!');

const fs = require('fs');
const path = require('path');

const modellar = JSON.parse(fs.readFileSync(path.join(__dirname, 'MODELLAR.json'), 'utf8'));

// Weapon Uzbek translations & prices
const weaponMeta = {
  1: { name: 'AK-47 (Stein Games)', price: 14.99, desc: "Afsonaviy AK-47 Kalashnikov avtomati. Stein Games to'plamidan yuqori aniqlikdagi klassik jangovar qurol modeli, to'liq PBR teksturalari bilan." },
  2: { name: 'M1911 to‘pponchasi', price: 7.99, desc: "Klassik M1911 to'pponchasi. Yuqori aniqlikdagi metall va yog'och detallar, toza o'yin topologiyasi." },
  3: { name: 'MP5 avtomati', price: 9.99, desc: "Mashhur MP5 pulemyot-to'pponchasi. Maxsus kuchlar va politsiya bo'linmalarining sevimli yengil quroli." },
  4: { name: 'MAC-10', price: 8.49, desc: "Taktik MAC-10 pulemyot-to'pponchasi. Yilqam, tezotar va ixcham o'lchamli jangovar model." },
  5: { name: 'M14 miltig‘i', price: 9.49, desc: "Klassik M14 yarim-avtomatik jangovar miltig'i. Yog'och qo'ndoq va uzoq masofaga mo'ljallangan stvol." },
  6: { name: 'M700 snayper miltig‘i', price: 11.99, desc: "M700 professional snayper miltig'i. Yuqori sifatli optik nishonlagich va taktik tayanch." },
  7: { name: 'TEC-9 to‘pponchasi', price: 6.99, desc: "Klassik TEC-9 yarim avtomatik to'pponchasi. Katta sig'imli to'g'ri magazinli model." },
  8: { name: 'Lever-Action miltig‘i', price: 8.99, desc: "Kovboycha dastakli Vinchyestr uslubidagi klassik miltiq. Antiqa yog'och va qoraytirilgan po'lat." },
  9: { name: 'AK-47 (Yengil variant)', price: 7.99, desc: "AK-47 Kalashnikov avtomati. O'yinlar va veb-loyihalar uchun optimallashtirilgan engil vaznli 3D model." },
  10: { name: 'M4A1 taktik karabini', price: 11.99, desc: "Zamonaviy M4A1 taktik avtomati. Teleskopik qo'ndoq, pikatinni relslari va to'liq jangovar jihozlar." },
  11: { name: 'Makarov to‘pponchasi (PM)', price: 5.99, desc: "Afsonaviy Makarov (PM) xizmat to'pponchasi. Ixcham o'lcham, toza topologiya va realizm." },
  12: { name: 'Luger P08 to‘pponchasi', price: 7.49, desc: "Tarixiy nemis Luger P08 to'pponchasi. O'ziga xos tirsakli qulf mexanizmi va nozik detallar." },
  13: { name: 'M3 Grease Gun', price: 6.49, desc: "Ikkinchi jahon urushi davridagi M3 'Grease Gun' pulemyot-to'pponchasi. Oddiy va mustahkam po'lat korpus." },
  14: { name: 'Suomi KP-31', price: 7.99, desc: "Finlyandiyaning afsonaviy Suomi KP-31 pulemyot-to'pponchasi. Katta barabanli magazin bilan." },
  15: { name: 'Shotgun ov miltig‘i', price: 8.49, desc: "Klassik pompalı Shotgun ov va maxsus operatsiyalar miltig'i. 12 kalibrli patronlar uchun." },
  16: { name: 'Harbiy snayper miltig‘i', price: 9.99, desc: "Zamonaviy armiya snayper miltig'i. Kamuflyajli korpus va optik nishonga olish tizimi." },
  17: { name: 'Signal to‘pponchasi (Flare gun)', price: 4.99, desc: "Dengiz va qutqaruv signal to'pponchasi (Flare gun). Yorqin qizil metall korpus." },
  18: { name: 'Flashbang granatasi', price: 3.99, desc: "Taktik shovqinli-yorug'lik granatasi (M84 Flashbang). Maxsus operatsiyalarda nishonni chalg'itish uchun." },
  19: { name: 'Frag jangovar granatasi', price: 4.49, desc: "Parcha-parcha bo'luvchi M67 jangovar mudofaa granatasi. Xavfsizlik halqasi va detonator qalpog'i bilan." },
  20: { name: 'M24 dasta granatasi', price: 4.99, desc: "Klassik yog'och dastali M24 Stielhandgranate granatasi. Tarixiy jangovar qurol modeli." },
};

function formatTitle(raw) {
  return raw
    .replace(/^car-kit_/, '')
    .replace(/^city-kit-suburban_/, '')
    .split(/[-_]/)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

const products = [];

// Add 100 models
for (const item of modellar) {
  const catFolder = item.category === '01_Qurollar' ? 'qurollar' : item.category === '02_Mashinalar' ? 'mashinalar' : 'binolar';
  const glbFilename = path.basename(item.file);
  const previewFilename = path.basename(item.preview);
  const glbUrl = `/models/${catFolder}/${glbFilename}`;
  const imageUrl = `/assets/previews/${previewFilename}`;
  
  let categoryName = 'Qurollar';
  let price = 6.99;
  let title = item.name;
  let desc = `Professional 3D model. Format: GLB / GLTF, Poligonlar: ${item.triangles}, Vertices: ${item.vertices}. O'yinlar va loyihalar uchun tayyor.`;

  if (item.category === '01_Qurollar') {
    categoryName = 'Qurollar';
    const meta = weaponMeta[item.id] || {};
    title = meta.name || item.name;
    price = meta.price || 8.99;
    desc = meta.desc || desc;
  } else if (item.category === '02_Mashinalar') {
    categoryName = 'Transport';
    const cleanName = formatTitle(item.name);
    title = `${cleanName} (Avto)`;
    price = +(4.99 + ((item.id % 7) * 0.7)).toFixed(2);
    desc = `${cleanName} past poligonli optimallashtirilgan transport vositasi 3D modeli. Kenney car-kit to'plamidan. O'yinlar va mobil ilovalar uchun ideal.`;
  } else if (item.category === '03_Uylar_va_binolar') {
    categoryName = 'Binolar';
    const cleanName = formatTitle(item.name);
    title = `Bino — ${cleanName}`;
    price = +(5.99 + ((item.id % 9) * 0.8)).toFixed(2);
    desc = `Shahar va turar-joy infratuzilmasi uchun ${cleanName} bino 3D modeli. Kenney city-kit to'plamidan. Shahar simulyatsiyalari uchun tayyor.`;
  }

  const sizeMb = (item.bytes / (1024 * 1024)).toFixed(1);
  const sizeStr = +sizeMb >= 0.1 ? `${sizeMb} MB` : `${Math.round(item.bytes / 1024)} KB`;

  products.push({
    id: `mod_${item.id}`,
    name: title,
    size: sizeStr,
    price: price,
    image: imageUrl,
    category: categoryName,
    polygons: Number(item.triangles).toLocaleString('en-US'),
    vertices: Number(item.vertices).toLocaleString('en-US'),
    format: 'GLB / 3D',
    textures: item.embedded_images > 0 ? 'PBR Tekstura' : 'Standart',
    has3D: true,
    glbUrl: glbUrl,
    author: item.author || '3D Creator',
    description: desc,
  });
}

console.log('Generated products count:', products.length);
console.log('Weapons count:', products.filter(p => p.category === 'Qurollar').length);
console.log('Cars count:', products.filter(p => p.category === 'Transport').length);
console.log('Buildings count:', products.filter(p => p.category === 'Binolar').length);

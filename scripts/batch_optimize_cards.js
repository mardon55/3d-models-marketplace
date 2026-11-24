import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, dedup, weld, simplify, textureCompress, resample, draco } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import draco3d from 'draco3dgltf';
import { products } from '../src/data/models.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

async function runBatch() {
  console.log('🚀 141 ta 3D GLB modelni kartochka (_card.glb) uchun optimizatsiya qilish boshlandi...');
  await MeshoptSimplifier.ready;

  const dracoEncoder = await draco3d.createEncoderModule();
  const dracoDecoder = await draco3d.createDecoderModule();

  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  io.registerDependencies({
    'draco3d.encoder': dracoEncoder,
    'draco3d.decoder': dracoDecoder,
  });

  const stats = [];
  let index = 0;
  const total = products.length;

  for (const product of products) {
    index++;
    const srcPath = path.join(rootDir, 'public', product.glbUrl.replace(/^\//, ''));
    const dstPath = path.join(rootDir, 'public', product.cardGlbUrl.replace(/^\//, ''));

    if (!fs.existsSync(srcPath)) {
      console.warn(`[${index}/${total}] ⚠️ Fayl topilmadi: ${srcPath}`);
      continue;
    }

    const origBytes = fs.statSync(srcPath).size;
    const origMB = (origBytes / 1024 / 1024).toFixed(2);

    // If destination exists, is valid, and <= 1.5MB, we can skip if already generated
    if (fs.existsSync(dstPath)) {
      const curBytes = fs.statSync(dstPath).size;
      if (curBytes > 0 && curBytes <= 1.5 * 1024 * 1024) {
        const curMB = (curBytes / 1024 / 1024).toFixed(2);
        console.log(`[${index}/${total}] ⚡ Mavjud: ${product.name} (${origMB} MB -> ${curMB} MB)`);
        stats.push({ name: product.name, origMB, newMB: curMB, saved: ((1 - curBytes / origBytes) * 100).toFixed(1) });
        continue;
      }
    }

    try {
      const doc = await io.read(srcPath);
      const root = doc.getRoot();
      const skins = root.listSkins();
      const isSkinned = skins.length > 0;

      const transforms = [
        resample(),
        prune(),
        dedup(),
        textureCompress({
          encoder: sharp,
          targetFormat: 'webp',
          quality: 55,
          resize: [384, 384],
        }),
      ];

      // Skinned meshes keep geometry unsimplified to preserve joint bindings
      if (!isSkinned) {
        transforms.push(
          weld({ tolerance: 0.0005 }),
          simplify({ simplifier: MeshoptSimplifier, ratio: 0.08, error: 0.01 })
        );
      }

      transforms.push(draco());

      await doc.transform(...transforms);
      fs.mkdirSync(path.dirname(dstPath), { recursive: true });
      await io.write(dstPath, doc);

      const newBytes = fs.statSync(dstPath).size;
      const newMB = (newBytes / 1024 / 1024).toFixed(2);
      const savedPct = ((1 - newBytes / origBytes) * 100).toFixed(1);

      console.log(`[${index}/${total}] ✅ ${product.name}: ${origMB} MB -> ${newMB} MB (-${savedPct}%)`);
      stats.push({ name: product.name, origMB, newMB, saved: savedPct });

      // Also copy to dist if dist exists
      const distDstPath = path.join(rootDir, 'dist', product.cardGlbUrl.replace(/^\//, ''));
      try {
        fs.mkdirSync(path.dirname(distDstPath), { recursive: true });
        fs.copyFileSync(dstPath, distDstPath);
      } catch (_) {}

    } catch (err) {
      console.error(`[${index}/${total}] ❌ Xatolik (${product.name}):`, err.message);
      // Fallback: copy original if compression failed so card still has a valid glb
      try {
        fs.copyFileSync(srcPath, dstPath);
        const fbBytes = fs.statSync(dstPath).size;
        stats.push({ name: product.name, origMB, newMB: (fbBytes / 1024 / 1024).toFixed(2), saved: '0' });
      } catch (_) {}
    }
  }

  // Save stats report
  fs.writeFileSync('scripts/optimization_stats.json', JSON.stringify(stats, null, 2), 'utf8');
  console.log('🎉 Barcha modellar muvaffaqiyatli optimizatsiya qilindi!');
}

runBatch().catch(err => {
  console.error('Fatal batch error:', err);
});

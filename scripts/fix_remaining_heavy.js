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

async function fixHeavy() {
  await MeshoptSimplifier.ready;

  const dracoEncoder = await draco3d.createEncoderModule();
  const dracoDecoder = await draco3d.createDecoderModule();

  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  io.registerDependencies({
    'draco3d.encoder': dracoEncoder,
    'draco3d.decoder': dracoDecoder,
  });

  const heavyProducts = products.filter(p => {
    const dstPath = path.join(rootDir, 'public', p.cardGlbUrl.replace(/^\//, ''));
    if (!fs.existsSync(dstPath)) return false;
    return fs.statSync(dstPath).size > 1.5 * 1024 * 1024;
  });

  console.log(`Fixing ${heavyProducts.length} heavy models...`);

  for (const product of heavyProducts) {
    const srcPath = path.join(rootDir, 'public', product.glbUrl.replace(/^\//, ''));
    const dstPath = path.join(rootDir, 'public', product.cardGlbUrl.replace(/^\//, ''));

    const doc = await io.read(srcPath);

    // Filter out non-triangle primitives (lines/points) that block Draco compression
    for (const mesh of doc.getRoot().listMeshes()) {
      for (const prim of mesh.listPrimitives()) {
        const mode = prim.getMode();
        // Mode 4 is TRIANGLES. Any line (1,2,3) or point (0) or polygon is removed or ignored for card
        if (mode !== 4) {
          prim.dispose();
        }
      }
    }

    await doc.transform(
      resample(),
      prune(),
      dedup(),
      textureCompress({
        encoder: sharp,
        targetFormat: 'webp',
        quality: 45,
        resize: [256, 256],
      }),
      weld({ tolerance: 0.001 }),
      simplify({ simplifier: MeshoptSimplifier, ratio: 0.04, error: 0.02 }),
      draco()
    );

    await io.write(dstPath, doc);
    const newBytes = fs.statSync(dstPath).size;
    const newMB = (newBytes / 1024 / 1024).toFixed(2);
    console.log(`✅ ${product.name}: now ${newMB} MB`);

    const distDstPath = path.join(rootDir, 'dist', product.cardGlbUrl.replace(/^\//, ''));
    try {
      fs.mkdirSync(path.dirname(distDstPath), { recursive: true });
      fs.copyFileSync(dstPath, distDstPath);
    } catch (_) {}
  }
}

fixHeavy().catch(console.error);

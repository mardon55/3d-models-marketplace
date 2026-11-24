import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS, KHRDracoMeshCompression } from '@gltf-transform/extensions'
import { prune, dedup, weld, simplify, textureCompress, resample, quantize, draco } from '@gltf-transform/functions'
import { MeshoptSimplifier } from 'meshoptimizer'
import sharp from 'sharp'
import draco3d from 'draco3dgltf'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

async function testOne() {
  await MeshoptSimplifier.ready

  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
  io.registerDependencies({
    'draco3d.encoder': await draco3d.createEncoderModule(),
    'draco3d.decoder': await draco3d.createDecoderModule(),
  })

  const src = path.join(rootDir, 'public/models/mashinalar/bmw_x6m.glb')
  const dst = path.join(rootDir, 'public/models/mashinalar/bmw_x6m_card.glb')

  const doc = await io.read(src)

  await doc.transform(
    resample(),
    prune(),
    dedup(),
    textureCompress({
      encoder: sharp,
      targetFormat: 'webp',
      quality: 55,
      resize: [384, 384],
    }),
    weld({ tolerance: 0.0005 }),
    simplify({ simplifier: MeshoptSimplifier, ratio: 0.05, error: 0.01 }),
    draco()
  )

  await io.write(dst, doc)

  const origSize = (fs.statSync(src).size / 1024 / 1024).toFixed(2)
  const newSize = (fs.statSync(dst).size / 1024 / 1024).toFixed(2)
  console.log('SUCCESS with DRACO! BMW X6M:', origSize, 'MB ->', newSize, 'MB')
}

testOne().catch(err => {
  console.error('Xatolik:', err)
})

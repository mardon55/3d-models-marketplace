import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { prune, dedup, weld, simplify, textureCompress, resample, draco } from '@gltf-transform/functions'
import { MeshoptSimplifier } from 'meshoptimizer'
import sharp from 'sharp'
import draco3d from 'draco3dgltf'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

async function testWeapon() {
  await MeshoptSimplifier.ready

  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
  io.registerDependencies({
    'draco3d.encoder': await draco3d.createEncoderModule(),
    'draco3d.decoder': await draco3d.createDecoderModule(),
  })

  const src = path.join(rootDir, 'public/models/qurollar/004_Mac10_stein.glb')
  const dst = path.join(rootDir, 'public/models/qurollar/004_Mac10_stein_card.glb')

  const doc = await io.read(src)
  const root = doc.getRoot()
  const skins = root.listSkins()
  const isSkinned = skins.length > 0

  console.log('Testing Mac10: isSkinned =', isSkinned, 'skins count =', skins.length)

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
  ]

  // For skinned meshes, keep geometry intact without simplification to prevent bone weight distortion
  if (!isSkinned) {
    transforms.push(
      weld({ tolerance: 0.0005 }),
      simplify({ simplifier: MeshoptSimplifier, ratio: 0.1, error: 0.01 })
    )
  }

  // Apply Draco compression
  transforms.push(draco())

  await doc.transform(...transforms)
  await io.write(dst, doc)

  const origSize = (fs.statSync(src).size / 1024 / 1024).toFixed(2)
  const newSize = (fs.statSync(dst).size / 1024 / 1024).toFixed(2)
  console.log('Mac10 card GLB size:', origSize, 'MB ->', newSize, 'MB')
}

testWeapon().catch(err => {
  console.error('Xatolik:', err)
})

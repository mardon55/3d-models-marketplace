import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

// 1. Scan all GLB files in public/models
function findGLBFiles(dir) {
  let results = []
  const list = fs.readdirSync(dir)
  for (const item of list) {
    const p = path.join(dir, item)
    const stat = fs.statSync(p)
    if (stat.isDirectory()) {
      results = results.concat(findGLBFiles(p))
    } else if (item.toLowerCase().endsWith('.glb')) {
      results.push(p)
    }
  }
  return results
}

const allGLBPaths = findGLBFiles(path.join(rootDir, 'public/models'))
console.log(`Jami topilgan diskdagi GLB fayllar: ${allGLBPaths.length}`)

// Helper to inspect GLB internal structure
function parseGLBInfo(filePath) {
  const stat = fs.statSync(filePath)
  const sizeMB = (stat.size / (1024 * 1024)).toFixed(2)

  const fd = fs.openSync(filePath, 'r')
  const headerBuf = Buffer.alloc(20)
  fs.readSync(fd, headerBuf, 0, 20, 0)

  const magic = headerBuf.readUInt32LE(0)
  if (magic !== 0x46546c67) {
    fs.closeSync(fd)
    return { sizeMB, error: 'Not a valid GLB' }
  }

  const jsonChunkLen = headerBuf.readUInt32LE(12)
  const jsonBuf = Buffer.alloc(jsonChunkLen)
  fs.readSync(fd, jsonBuf, 0, jsonChunkLen, 20)
  fs.closeSync(fd)

  let gltf
  try {
    gltf = JSON.parse(jsonBuf.toString('utf8'))
  } catch (e) {
    return { sizeMB, error: 'JSON chunk parse error' }
  }

  // Calculate triangle count from accessors
  let triangleCount = 0
  if (gltf.meshes) {
    for (const mesh of gltf.meshes) {
      if (mesh.primitives) {
        for (const prim of mesh.primitives) {
          if (prim.indices !== undefined && gltf.accessors && gltf.accessors[prim.indices]) {
            triangleCount += Math.floor(gltf.accessors[prim.indices].count / 3)
          } else if (prim.attributes && prim.attributes.POSITION !== undefined && gltf.accessors && gltf.accessors[prim.attributes.POSITION]) {
            triangleCount += Math.floor(gltf.accessors[prim.attributes.POSITION].count / 3)
          }
        }
      }
    }
  }

  const textureCount = gltf.textures ? gltf.textures.length : (gltf.images ? gltf.images.length : 0)
  const imageCount = gltf.images ? gltf.images.length : 0
  const skinCount = gltf.skins ? gltf.skins.length : 0
  const animationCount = gltf.animations ? gltf.animations.length : 0

  let boneCount = 0
  if (gltf.skins) {
    for (const skin of gltf.skins) {
      if (skin.joints) boneCount += skin.joints.length
    }
  }

  return {
    sizeMB,
    sizeBytes: stat.size,
    triangleCount,
    textureCount: Math.max(textureCount, imageCount),
    hasSkin: skinCount > 0,
    boneCount,
    hasAnimation: animationCount > 0,
    animationCount,
    meshCount: gltf.meshes ? gltf.meshes.length : 0,
    materialCount: gltf.materials ? gltf.materials.length : 0,
  }
}

// 2. Parse products from src/data/models.ts
const modelsTsContent = fs.readFileSync(path.join(rootDir, 'src/data/models.ts'), 'utf8')
const productsMatch = modelsTsContent.match(/export const products: Product\[\] = (\[[\s\S]*?\n\]);?\s*export const categories/)
if (!productsMatch) {
  console.error("products ro'yxatini models.ts dan ajratib bo'lmadi!")
  process.exit(1)
}

const products = JSON.parse(productsMatch[1])
console.log(`Jami katalogdagi mahsulotlar: ${products.length}`)

// 3. Audit each product
const auditResults = []
const missingGLB = []
const mismatchedGLB = []

for (const p of products) {
  let glbPath = p.glbUrl ? path.join(rootDir, 'public', p.glbUrl.replace(/^\//, '')) : null
  let fileExists = glbPath && fs.existsSync(glbPath)
  let glbInfo = fileExists ? parseGLBInfo(glbPath) : null

  // Check mismatches
  let issue = null
  if (!p.glbUrl) {
    issue = 'glbUrl mavjud emas'
    missingGLB.push(p)
  } else if (!fileExists) {
    issue = `Fayl topilmadi: ${p.glbUrl}`
    missingGLB.push(p)
  } else {
    // Check semantic mismatches
    const pName = p.name.toLowerCase()
    const urlLower = p.glbUrl.toLowerCase()

    if (p.id === 'mercedes' || (pName.includes('mercedes') && urlLower.includes('car-kit_hatchback'))) {
      issue = "Noto'g'ri bog'langan: Mercedes G63 ga toy hatchback ulangan"
      mismatchedGLB.push({ product: p, issue })
    } else if (p.id === 'villa' || (pName.includes('villa') && urlLower.includes('city-kit-suburban'))) {
      issue = "Noto'g'ri bog'langan: Villaga suburban oddiy uy ulangan"
      mismatchedGLB.push({ product: p, issue })
    }
  }

  auditResults.push({
    id: p.id,
    name: p.name,
    category: p.category || 'Noma\'lum',
    glbUrl: p.glbUrl || 'YO\'Q',
    exists: fileExists,
    info: glbInfo,
    issue,
  })
}

// Write full audit JSON
fs.writeFileSync(path.join(rootDir, 'scripts/audit_result.json'), JSON.stringify({
  totalProducts: products.length,
  totalDiskGLBs: allGLBPaths.length,
  missingCount: missingGLB.length,
  mismatchedCount: mismatchedGLB.length,
  results: auditResults,
  allDiskGLBs: allGLBPaths.map(p => path.relative(path.join(rootDir, 'public'), p).replace(/\\/g, '/'))
}, null, 2))

console.log("Audit yakunlandi! Natijalar scripts/audit_result.json ga yozildi.")

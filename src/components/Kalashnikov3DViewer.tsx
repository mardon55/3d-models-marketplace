import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { RotateCw, Layers, Box, Flame, Volume2, VolumeX, RotateCcw } from 'lucide-react'

/* ============================================================================
   1. PROCEDURAL PBR TEXTURES (Wood Grain, Brushed Gunmetal, Stippled Bakelite, Laminate)
   ============================================================================ */
function createWoodTextures() {
  const width = 1024
  const height = 512
  const mk = () => {
    const c = document.createElement('canvas')
    c.width = width
    c.height = height
    return c
  }
  const albedoCanvas = mk()
  const ctx = albedoCanvas.getContext('2d')!
  const bumpCanvas = mk()
  const bCtx = bumpCanvas.getContext('2d')!

  const base = ctx.createLinearGradient(0, 0, 0, height)
  base.addColorStop(0, '#8a3d17')
  base.addColorStop(0.5, '#9a4a1e')
  base.addColorStop(1, '#7a3112')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, width, height)
  bCtx.fillStyle = '#808080'
  bCtx.fillRect(0, 0, width, height)

  for (let y = 0; y < height; y++) {
    const wave = Math.sin(y * 0.045) * 18 + Math.cos(y * 0.017) * 11 + Math.sin(y * 0.11) * 4
    for (let x = 0; x < width; x += 2) {
      const warp = Math.sin(x * 0.009 + wave * 0.06) * 14 + Math.sin(x * 0.031 + y * 0.02) * 3
      const grain = Math.sin((y + warp) * 0.42) * 0.6 + Math.sin((y + warp) * 0.11) * 0.4
      const fine = (Math.random() - 0.5) * 10
      const val = grain * 26 + fine

      const r = Math.min(255, Math.max(0, 150 + val))
      const g = Math.min(255, Math.max(0, 68 + val * 0.58))
      const bl = Math.min(255, Math.max(0, 26 + val * 0.28))
      ctx.fillStyle = `rgb(${r | 0},${g | 0},${bl | 0})`
      ctx.fillRect(x, y, 2, 1)

      const bVal = Math.min(255, Math.max(0, 128 + grain * 30 + fine))
      bCtx.fillStyle = `rgb(${bVal | 0},${bVal | 0},${bVal | 0})`
      bCtx.fillRect(x, y, 2, 1)
    }
  }

  for (let i = 0; i < 150; i++) {
    const y = Math.random() * height
    const x = Math.random() * width
    const len = 80 + Math.random() * 320
    ctx.fillStyle = `rgba(48, 16, 6, ${0.08 + Math.random() * 0.14})`
    ctx.fillRect(x, y, len, 1 + Math.random() * 1.5)
  }
  for (let i = 0; i < 90; i++) {
    const y = Math.random() * height
    const x = Math.random() * width
    const len = 60 + Math.random() * 220
    ctx.fillStyle = `rgba(220, 130, 60, ${0.05 + Math.random() * 0.1})`
    ctx.fillRect(x, y, len, 1)
  }
  for (let i = 0; i < 2600; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    ctx.fillStyle = 'rgba(30, 10, 4, 0.22)'
    ctx.fillRect(x, y, 3 + Math.random() * 6, 1)
    bCtx.fillStyle = 'rgba(70,70,70,0.5)'
    bCtx.fillRect(x, y, 3 + Math.random() * 6, 1)
  }

  ctx.fillStyle = 'rgba(38, 12, 4, 0.14)'
  for (let y = 0; y < height; y += 32) {
    ctx.fillRect(0, y, width, 3)
  }

  for (let i = 0; i < 14; i++) {
    const gx = Math.random() * width
    const gy = Math.random() * height
    const rad = 40 + Math.random() * 90
    const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, rad)
    grad.addColorStop(0, 'rgba(40, 14, 6, 0.16)')
    grad.addColorStop(1, 'rgba(40, 14, 6, 0)')
    ctx.fillStyle = grad
    ctx.fillRect(gx - rad, gy - rad, rad * 2, rad * 2)
  }

  const map = new THREE.CanvasTexture(albedoCanvas)
  map.colorSpace = THREE.SRGBColorSpace
  map.wrapS = map.wrapT = THREE.RepeatWrapping
  map.anisotropy = 8

  const bumpMap = new THREE.CanvasTexture(bumpCanvas)
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping
  bumpMap.anisotropy = 8

  return { map, bumpMap }
}

function createSteelTextures() {
  const size = 256
  const roughCanvas = document.createElement('canvas')
  roughCanvas.width = size
  roughCanvas.height = size
  const rCtx = roughCanvas.getContext('2d')!

  const bumpCanvas = document.createElement('canvas')
  bumpCanvas.width = size
  bumpCanvas.height = size
  const bCtx = bumpCanvas.getContext('2d')!

  rCtx.fillStyle = '#585858'
  rCtx.fillRect(0, 0, size, size)
  bCtx.fillStyle = '#808080'
  bCtx.fillRect(0, 0, size, size)

  for (let i = 0; i < 9000; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const len = 8 + Math.random() * 28
    const shade = 70 + Math.random() * 55
    rCtx.fillStyle = `rgba(${shade | 0},${shade | 0},${shade | 0},0.22)`
    rCtx.fillRect(x, y, len, 1)

    const bShade = 115 + Math.random() * 26
    bCtx.fillStyle = `rgba(${bShade | 0},${bShade | 0},${bShade | 0},0.25)`
    bCtx.fillRect(x, y, len * 0.7, 1)
  }

  for (let i = 0; i < 26; i++) {
    const gx = Math.random() * size
    const gy = Math.random() * size
    const rad = 14 + Math.random() * 34
    const grad = rCtx.createRadialGradient(gx, gy, 0, gx, gy, rad)
    grad.addColorStop(0, 'rgba(20,20,20,0.35)')
    grad.addColorStop(1, 'rgba(20,20,20,0)')
    rCtx.fillStyle = grad
    rCtx.fillRect(gx - rad, gy - rad, rad * 2, rad * 2)
  }

  const roughnessMap = new THREE.CanvasTexture(roughCanvas)
  roughnessMap.anisotropy = 8
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping

  const bumpMap = new THREE.CanvasTexture(bumpCanvas)
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping

  return { roughnessMap, bumpMap }
}

function createBakeliteTextures() {
  const size = 256
  const albedoCanvas = document.createElement('canvas')
  albedoCanvas.width = size
  albedoCanvas.height = size
  const ctx = albedoCanvas.getContext('2d')!

  const bumpCanvas = document.createElement('canvas')
  bumpCanvas.width = size
  bumpCanvas.height = size
  const bCtx = bumpCanvas.getContext('2d')!

  ctx.fillStyle = '#5c1f12'
  ctx.fillRect(0, 0, size, size)
  bCtx.fillStyle = '#808080'
  bCtx.fillRect(0, 0, size, size)

  for (let i = 0; i < 1800; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const r = 1 + Math.random() * 3
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(170, 70, 28, 0.3)' : 'rgba(30, 8, 6, 0.3)'
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  bCtx.strokeStyle = 'rgba(215, 215, 215, 0.45)'
  bCtx.lineWidth = 1
  const step = 8
  for (let i = -size; i < size * 2; i += step) {
    bCtx.beginPath()
    bCtx.moveTo(i, 0)
    bCtx.lineTo(i + size, size)
    bCtx.stroke()

    bCtx.beginPath()
    bCtx.moveTo(i, size)
    bCtx.lineTo(i + size, 0)
    bCtx.stroke()
  }

  const map = new THREE.CanvasTexture(albedoCanvas)
  map.colorSpace = THREE.SRGBColorSpace
  map.wrapS = map.wrapT = THREE.RepeatWrapping

  const bumpMap = new THREE.CanvasTexture(bumpCanvas)
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping

  return { map, bumpMap }
}

function createLaminateTextures() {
  const W = 1024
  const H = 512
  const mk = () => {
    const c = document.createElement('canvas')
    c.width = W
    c.height = H
    return c
  }
  const aC = mk()
  const bC = mk()
  const aX = aC.getContext('2d')!
  const bX = bC.getContext('2d')!
  const aImg = aX.createImageData(W, H)
  const bImg = bX.createImageData(W, H)

  const G = 64
  const grid = new Float32Array((G + 1) * (G + 1))
  let seed = 1337
  const rnd = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  for (let i = 0; i < grid.length; i++) grid[i] = rnd()
  const sm = (t: number) => t * t * (3 - 2 * t)
  const vnoise = (x: number, y: number) => {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const xf = sm(x - xi)
    const yf = sm(y - yi)
    const g = (a: number, b: number) => grid[(((b % G) + G) % G) * (G + 1) + (((a % G) + G) % G)]
    const top = g(xi, yi) * (1 - xf) + g(xi + 1, yi) * xf
    const bot = g(xi, yi + 1) * (1 - xf) + g(xi + 1, yi + 1) * xf
    return top * (1 - yf) + bot * yf
  }
  const mix = (a: number, b: number, t: number) => a + (b - a) * t
  const orHi = [246, 162, 36]
  const orLo = [226, 120, 28]
  const rdHi = [204, 88, 32]
  const rdLo = [150, 52, 22]
  const dark = [84, 26, 12]
  const period = 1.45
  const orangeEnd = 1.24

  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const nx = px / W
      const ny = py / H
      const ex = (nx - 0.21) / 0.15
      const ey = (ny - 0.49) / 0.2
      const ex2 = (nx - 0.93) / 0.1
      const ey2 = (ny - 0.4) / 0.17
      const d = Math.min(Math.sqrt(ex * ex + ey * ey), Math.sqrt(ex2 * ex2 + ey2 * ey2) * 1.1)
      const warp = (vnoise(nx * 6, ny * 6) - 0.5) * 0.5 + (vnoise(nx * 14, ny * 14) - 0.5) * 0.12
      const h = d + warp * 0.9
      const t = ((h % period) + period) % period
      let c: number[]
      if (t < orangeEnd) {
        const u = Math.pow(t / orangeEnd, 1.6)
        c = [mix(orHi[0], orLo[0], u), mix(orHi[1], orLo[1], u), mix(orHi[2], orLo[2], u)]
      } else {
        const u = (t - orangeEnd) / (period - orangeEnd)
        c = [mix(rdHi[0], rdLo[0], u), mix(rdHi[1], rdLo[1], u), mix(rdHi[2], rdLo[2], u)]
      }
      const de = Math.min(t, period - t, Math.abs(t - orangeEnd))
      const ln = h > 0.45 ? Math.pow(Math.max(0, 1 - de / 0.05), 2) : 0
      c = [mix(c[0], dark[0], ln * 0.85), mix(c[1], dark[1], ln * 0.85), mix(c[2], dark[2], ln * 0.85)]
      const rim = 0.7 + 0.3 * Math.min(1, Math.min(ny, 1 - ny) / 0.08)
      const grain = (vnoise(nx * 14, ny * 220) - 0.5) * 14
      const i4 = (py * W + px) * 4
      aImg.data[i4] = Math.max(0, Math.min(255, c[0] * rim + grain))
      aImg.data[i4 + 1] = Math.max(0, Math.min(255, c[1] * rim + grain * 0.7))
      aImg.data[i4 + 2] = Math.max(0, Math.min(255, c[2] * rim + grain * 0.4))
      aImg.data[i4 + 3] = 255
      const bv = Math.max(0, Math.min(255, 128 - ln * 55 + grain * 0.8))
      bImg.data[i4] = bImg.data[i4 + 1] = bImg.data[i4 + 2] = bv
      bImg.data[i4 + 3] = 255
    }
  }
  aX.putImageData(aImg, 0, 0)
  bX.putImageData(bImg, 0, 0)

  const map = new THREE.CanvasTexture(aC)
  map.colorSpace = THREE.SRGBColorSpace
  map.wrapS = map.wrapT = THREE.RepeatWrapping
  map.anisotropy = 8
  const bumpMap = new THREE.CanvasTexture(bC)
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping
  bumpMap.anisotropy = 8
  ;[map, bumpMap].forEach((t) => {
    t.repeat.set(1 / 0.58, 1 / 0.23)
    t.offset.set(0.89 / 0.58, 0.14 / 0.23)
  })
  return { map, bumpMap }
}

export function Kalashnikov3DViewer({ className = '' }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const labelsRef = useRef<HTMLDivElement>(null)
  const [mode, setModeState] = useState<'free' | 'explode' | 'magazine'>('free')
  const [soundOn, setSoundOn] = useState(true)
  const soundRef = useRef(true)

  const triggerFireRef = useRef<() => void>(() => {})
  const setModeRef = useRef<(m: 'free' | 'explode' | 'magazine') => void>(() => {})
  const resetCameraRef = useRef<() => void>(() => {})

  useEffect(() => {
    soundRef.current = soundOn
  }, [soundOn])

  useEffect(() => {
    const container = containerRef.current
    const labelsLayer = labelsRef.current
    if (!container || !labelsLayer) return

    const width = container.clientWidth || 360
    const height = container.clientHeight || 300

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.05, 50)
    const DEFAULT_CAM_POS = new THREE.Vector3(0.04, 0.04, 2.15)
    const DEFAULT_TARGET = new THREE.Vector3(0.04, 0.01, 0.0)
    camera.position.copy(DEFAULT_CAM_POS)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMappingExposure = 1.05
    container.innerHTML = ''
    container.appendChild(renderer.domElement)

    // Environment
    const pmrem = new THREE.PMREMGenerator(renderer)
    const roomEnv = new RoomEnvironment()
    const envRT = pmrem.fromScene(roomEnv, 0.04)
    scene.environment = envRT.texture
    roomEnv.dispose()

    // Studio Lighting
    const ambientLight = new THREE.HemisphereLight(0xe2e8f0, 0x111827, 0.42)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xfff4e6, 2.8)
    keyLight.position.set(2.8, 4.2, 3.5)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 1024
    keyLight.shadow.mapSize.height = 1024
    keyLight.shadow.bias = -0.0003
    keyLight.shadow.normalBias = 0.012
    scene.add(keyLight)

    const rimLight = new THREE.DirectionalLight(0xa5c8ff, 2.2)
    rimLight.position.set(-3.2, 2.4, -2.8)
    scene.add(rimLight)

    const fillLight = new THREE.DirectionalLight(0xffe2b0, 0.55)
    fillLight.position.set(-2.0, -1.5, 2.6)
    scene.add(fillLight)

    // Shadow catcher floor
    const shadowGeo = new THREE.PlaneGeometry(10, 10)
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.35 })
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat)
    shadowPlane.rotation.x = -Math.PI / 2
    shadowPlane.position.y = -0.68
    shadowPlane.receiveShadow = true
    scene.add(shadowPlane)

    const ringGeo = new THREE.RingGeometry(1.15, 1.165, 96)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.06,
      side: THREE.DoubleSide,
    })
    const studioRing = new THREE.Mesh(ringGeo, ringMat)
    studioRing.rotation.x = -Math.PI / 2
    studioRing.position.y = -0.678
    scene.add(studioRing)

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.075
    controls.minDistance = 0.65
    controls.maxDistance = 5.5
    controls.maxPolarAngle = Math.PI * 0.85
    controls.target.copy(DEFAULT_TARGET)
    controls.update()

    // Textures & Materials
    const woodTex = createWoodTextures()
    const steelTex = createSteelTextures()
    const bakeliteTex = createBakeliteTextures()
    const laminateTex = createLaminateTextures()

    woodTex.map.repeat.set(2.4, 4.8)
    woodTex.bumpMap.repeat.set(2.4, 4.8)
    bakeliteTex.map.repeat.set(5, 5)
    bakeliteTex.bumpMap.repeat.set(7, 7)

    const matBluedSteel = new THREE.MeshPhysicalMaterial({
      color: 0x2a2f38,
      metalness: 0.92,
      roughness: 0.4,
      roughnessMap: steelTex.roughnessMap,
      bumpMap: steelTex.bumpMap,
      bumpScale: 0.003,
      clearcoat: 0.12,
      clearcoatRoughness: 0.55,
      envMapIntensity: 1.25,
    })

    const matDarkSteel = new THREE.MeshPhysicalMaterial({
      color: 0x1b1f26,
      metalness: 0.9,
      roughness: 0.46,
      roughnessMap: steelTex.roughnessMap,
      bumpMap: steelTex.bumpMap,
      bumpScale: 0.0035,
      envMapIntensity: 1.15,
    })

    const matBoltSteel = new THREE.MeshPhysicalMaterial({
      color: 0xb4bcc8,
      metalness: 1.0,
      roughness: 0.26,
      roughnessMap: steelTex.roughnessMap,
      bumpMap: steelTex.bumpMap,
      bumpScale: 0.0015,
      envMapIntensity: 1.4,
    })

    const matLaminate = new THREE.MeshPhysicalMaterial({
      map: laminateTex.map,
      bumpMap: laminateTex.bumpMap,
      bumpScale: 0.004,
      metalness: 0.0,
      roughness: 0.34,
      clearcoat: 0.7,
      clearcoatRoughness: 0.22,
      envMapIntensity: 0.9,
    })

    const matWood = new THREE.MeshPhysicalMaterial({
      map: woodTex.map,
      bumpMap: woodTex.bumpMap,
      bumpScale: 0.007,
      metalness: 0.0,
      roughness: 0.5,
      clearcoat: 0.45,
      clearcoatRoughness: 0.32,
      envMapIntensity: 0.9,
    })

    const matWoodDark = matWood.clone()
    matWoodDark.color = new THREE.Color(0x9b7a68)
    matWoodDark.roughness = 0.62

    const matBarrelSteel = new THREE.MeshPhysicalMaterial({
      color: 0x646b76,
      metalness: 0.88,
      roughness: 0.36,
      roughnessMap: steelTex.roughnessMap,
      bumpMap: steelTex.bumpMap,
      bumpScale: 0.003,
      envMapIntensity: 1.3,
    })

    const matBarrelDark = new THREE.MeshPhysicalMaterial({
      color: 0x3f454e,
      metalness: 0.88,
      roughness: 0.4,
      roughnessMap: steelTex.roughnessMap,
      bumpMap: steelTex.bumpMap,
      bumpScale: 0.003,
      envMapIntensity: 1.2,
    })

    const matBlack = new THREE.MeshStandardMaterial({ color: 0x050608, metalness: 0.3, roughness: 0.8 })

    const matBakelite = new THREE.MeshPhysicalMaterial({
      map: bakeliteTex.map,
      bumpMap: bakeliteTex.bumpMap,
      bumpScale: 0.008,
      metalness: 0.05,
      roughness: 0.4,
      clearcoat: 0.25,
      clearcoatRoughness: 0.4,
    })

    const matMagBase = new THREE.MeshPhysicalMaterial({
      color: 0x2a2b2e,
      metalness: 0.5,
      roughness: 0.5,
      envMapIntensity: 1.0,
    })

    const matBrass = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.92,
      roughness: 0.2,
    })

    const matCopper = new THREE.MeshStandardMaterial({
      color: 0xb86238,
      metalness: 0.9,
      roughness: 0.24,
    })

    // Hierarchy
    const rifleRoot = new THREE.Group()
    scene.add(rifleRoot)
    const recoilGroup = new THREE.Group()
    rifleRoot.add(recoilGroup)

    const parts = {
      buttstock: new THREE.Group(),
      receiver: new THREE.Group(),
      dustCover: new THREE.Group(),
      boltCarrier: new THREE.Group(),
      grip: new THREE.Group(),
      handguard: new THREE.Group(),
      barrel: new THREE.Group(),
      magazine: new THREE.Group(),
      showcaseCartridges: new THREE.Group(),
    }

    Object.values(parts).forEach((g) => {
      if (g !== parts.showcaseCartridges) {
        recoilGroup.add(g)
      }
    })
    scene.add(parts.showcaseCartridges)

    function applyShadows(group: THREE.Group) {
      group.traverse((obj: any) => {
        if (obj.isMesh) {
          obj.castShadow = true
          obj.receiveShadow = true
        }
      })
    }

    function createDecorativeCartridge() {
      const cart = new THREE.Group()
      const casePts = [
        new THREE.Vector2(0.0, 0.0),
        new THREE.Vector2(0.011, 0.0),
        new THREE.Vector2(0.011, 0.004),
        new THREE.Vector2(0.0095, 0.0055),
        new THREE.Vector2(0.011, 0.0075),
        new THREE.Vector2(0.0102, 0.056),
        new THREE.Vector2(0.0082, 0.064),
        new THREE.Vector2(0.0082, 0.074),
        new THREE.Vector2(0.0, 0.074),
      ]
      const caseMesh = new THREE.Mesh(new THREE.LatheGeometry(casePts, 20), matBrass)
      cart.add(caseMesh)

      const tipPts = [
        new THREE.Vector2(0.0, 0.073),
        new THREE.Vector2(0.008, 0.073),
        new THREE.Vector2(0.0078, 0.084),
        new THREE.Vector2(0.0062, 0.095),
        new THREE.Vector2(0.0034, 0.105),
        new THREE.Vector2(0.0005, 0.111),
        new THREE.Vector2(0.0, 0.1115),
      ]
      const tipMesh = new THREE.Mesh(new THREE.LatheGeometry(tipPts, 20), matCopper)
      cart.add(tipMesh)
      return cart
    }

    // A. Buttstock
    ;(function buildButtstock() {
      const shape = new THREE.Shape()
      shape.moveTo(-0.33, 0.07)
      shape.bezierCurveTo(-0.37, 0.062, -0.41, 0.036, -0.462, 0.036)
      shape.bezierCurveTo(-0.5, 0.036, -0.51, 0.068, -0.56, 0.07)
      shape.lineTo(-0.85, 0.07)
      shape.quadraticCurveTo(-0.874, 0.07, -0.874, 0.05)
      shape.lineTo(-0.87, -0.098)
      shape.quadraticCurveTo(-0.868, -0.122, -0.844, -0.12)
      shape.bezierCurveTo(-0.72, -0.108, -0.6, -0.082, -0.5, -0.05)
      shape.quadraticCurveTo(-0.42, -0.026, -0.33, -0.008)
      shape.closePath()

      const woodGeo = new THREE.ExtrudeGeometry(shape, {
        steps: 8,
        depth: 0.044,
        bevelEnabled: true,
        bevelThickness: 0.016,
        bevelSize: 0.014,
        bevelSegments: 9,
      })
      woodGeo.translate(0, 0, -0.022)

      const X_BACK = -0.42,
        X_FRONT = -0.33
      const W_FULL = 0.038,
        W_RECV = 0.0325
      const ARCH_DROP = 0.026
      const topPts = new THREE.CubicBezierCurve(
        new THREE.Vector2(-0.33, 0.07),
        new THREE.Vector2(-0.37, 0.062),
        new THREE.Vector2(-0.41, 0.036),
        new THREE.Vector2(-0.462, 0.036)
      ).getPoints(240)
      const topAt = (x: number) => {
        if (x >= -0.33) return 0.07
        for (let i = 1; i < topPts.length; i++) {
          if (topPts[i].x <= x) {
            const a = topPts[i - 1],
              b = topPts[i]
            return a.y + (b.y - a.y) * ((x - a.x) / (b.x - a.x || 1))
          }
        }
        return topPts[topPts.length - 1].y
      }
      const smooth = (v: number) => {
        v = Math.min(1, Math.max(0, v))
        return v * v * (3 - 2 * v)
      }
      const pa = woodGeo.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < pa.count; i++) {
        const x = pa.getX(i),
          y = pa.getY(i),
          z = pa.getZ(i)
        const t = smooth((x - X_BACK) / (X_FRONT - X_BACK))
        if (t <= 0) continue
        const s = Math.min(1, Math.abs(z) / W_FULL)
        const kz = 1 - t * (1 - W_RECV / W_FULL)
        const wy = smooth((y - (topAt(x) - 0.012)) / 0.012)
        const drop = t * wy * ARCH_DROP * (1 - Math.sqrt(1 - s * s))
        pa.setXYZ(i, x, y - drop, z * kz)
      }
      pa.needsUpdate = true
      woodGeo.computeVertexNormals()

      const woodMesh = new THREE.Mesh(woodGeo, matLaminate)
      parts.buttstock.add(woodMesh)

      const plateShape = new THREE.Shape()
      plateShape.moveTo(-0.866, 0.062)
      plateShape.lineTo(-0.884, 0.06)
      plateShape.lineTo(-0.878, -0.112)
      plateShape.lineTo(-0.858, -0.11)
      plateShape.closePath()
      const plateGeo = new THREE.ExtrudeGeometry(plateShape, {
        depth: 0.056,
        bevelEnabled: true,
        bevelThickness: 0.004,
        bevelSize: 0.004,
        bevelSegments: 3,
      })
      plateGeo.translate(0.006, 0, -0.028)
      plateGeo.scale(1, 1, 0.82)
      parts.buttstock.add(new THREE.Mesh(plateGeo, matDarkSteel))

      const swivelBase = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.018, 16), matDarkSteel)
      swivelBase.position.set(-0.71, -0.098, 0)
      swivelBase.rotation.z = -0.35
      parts.buttstock.add(swivelBase)

      const swivelLoop = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.0032, 10, 24), matDarkSteel)
      swivelLoop.position.set(-0.71, -0.111, 0)
      swivelLoop.rotation.y = Math.PI / 2
      parts.buttstock.add(swivelLoop)

      const STOCK_LIFT = 0.028
      const stockInner = new THREE.Group()
      stockInner.position.y = STOCK_LIFT
      while (parts.buttstock.children.length) stockInner.add(parts.buttstock.children[0])
      parts.buttstock.add(stockInner)
    })()

    // B. Receiver
    ;(function buildReceiver() {
      const recShape = new THREE.Shape()
      recShape.moveTo(-0.335, 0.082)
      recShape.lineTo(0.155, 0.082)
      recShape.lineTo(0.155, 0.006)
      recShape.lineTo(-0.335, 0.006)
      recShape.closePath()
      const recGeo = new THREE.ExtrudeGeometry(recShape, {
        depth: 0.054,
        bevelEnabled: true,
        bevelThickness: 0.004,
        bevelSize: 0.004,
        bevelSegments: 3,
      })
      recGeo.translate(0, 0, -0.027)
      parts.receiver.add(new THREE.Mesh(recGeo, matBluedSteel))

      const dimpleGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.065, 24)
      dimpleGeo.rotateX(Math.PI / 2)
      dimpleGeo.scale(1.45, 0.62, 1)
      const dimpleMesh = new THREE.Mesh(dimpleGeo, matDarkSteel)
      dimpleMesh.position.set(-0.01, 0.036, 0)
      parts.receiver.add(dimpleMesh)

      const rivetPositions = [
        [-0.31, 0.068],
        [-0.31, 0.022],
        [-0.17, 0.016],
        [-0.11, 0.016],
        [0.115, 0.068],
        [0.115, 0.024],
        [0.135, 0.048],
      ]
      const rivetGeo = new THREE.SphereGeometry(0.0045, 12, 10)
      rivetPositions.forEach(([rx, ry]) => {
        const rLeft = new THREE.Mesh(rivetGeo, matBoltSteel)
        rLeft.position.set(rx, ry, 0.031)
        parts.receiver.add(rLeft)
        const rRight = new THREE.Mesh(rivetGeo, matBoltSteel)
        rRight.position.set(rx, ry, -0.031)
        parts.receiver.add(rRight)
      })

      // Selector lever
      const selectorGroup = new THREE.Group()
      selectorGroup.position.set(-0.24, 0.042, 0.033)
      const pivotCap = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.006, 20), matDarkSteel)
      pivotCap.rotation.x = Math.PI / 2
      selectorGroup.add(pivotCap)
      const leverArm = new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.014, 0.004), matDarkSteel)
      leverArm.position.set(0.078, 0.012, 0.001)
      leverArm.rotation.z = 0.14
      selectorGroup.add(leverArm)
      const fingerTab = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.018, 0.012), matDarkSteel)
      fingerTab.position.set(0.155, 0.023, 0.005)
      fingerTab.rotation.z = 0.14
      selectorGroup.add(fingerTab)
      parts.receiver.add(selectorGroup)

      // Dovetail rail
      const sideRail = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.022, 0.008), matDarkSteel)
      sideRail.position.set(-0.18, 0.046, -0.033)
      parts.receiver.add(sideRail)

      // Rear sight block
      const rsbBase = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.056, 0.056), matBluedSteel)
      rsbBase.position.set(0.175, 0.088, 0)
      parts.receiver.add(rsbBase)

      const sightLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.01, 0.028), matBoltSteel)
      sightLeaf.position.set(0.168, 0.122, 0)
      sightLeaf.rotation.z = -0.14
      parts.receiver.add(sightLeaf)

      // Trigger guard & Trigger
      const guardCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.21, 0.005, 0),
        new THREE.Vector3(-0.205, -0.045, 0),
        new THREE.Vector3(-0.155, -0.055, 0),
        new THREE.Vector3(-0.105, -0.045, 0),
        new THREE.Vector3(-0.095, 0.005, 0),
      ])
      const guardTube = new THREE.TubeGeometry(guardCurve, 28, 0.0045, 10, false)
      guardTube.scale(1, 1, 2.4)
      parts.receiver.add(new THREE.Mesh(guardTube, matDarkSteel))

      const trigCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.152, 0.004, 0),
        new THREE.Vector3(-0.158, -0.018, 0),
        new THREE.Vector3(-0.146, -0.036, 0),
      ])
      const trigGeo = new THREE.TubeGeometry(trigCurve, 18, 0.004, 10, false)
      trigGeo.scale(1, 1, 1.5)
      parts.receiver.add(new THREE.Mesh(trigGeo, matBoltSteel))

      const magCatch = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.038, 0.022), matDarkSteel)
      magCatch.position.set(-0.088, -0.014, 0)
      magCatch.rotation.z = 0.25
      parts.receiver.add(magCatch)

      const port = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.003), matBlack)
      port.position.set(0.04, 0.05, 0.0315)
      parts.receiver.add(port)
      const selSlot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.008, 0.003), matBlack)
      selSlot.position.set(-0.15, 0.036, 0.0315)
      parts.receiver.add(selSlot)

      const frontTrun = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.062), matDarkSteel)
      frontTrun.position.set(0.135, 0.044, 0)
      parts.receiver.add(frontTrun)
      const rearTrun = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.078, 0.06), matDarkSteel)
      rearTrun.position.set(-0.325, 0.045, 0)
      parts.receiver.add(rearTrun)
    })()

    // C. Dust Cover
    ;(function buildDustCover() {
      const coverLength = 0.445
      const archGeo = new THREE.CylinderGeometry(0.0295, 0.031, coverLength, 28, 1, false, 0, Math.PI)
      archGeo.rotateZ(Math.PI / 2)
      archGeo.scale(1, 0.92, 1.02)
      const archMesh = new THREE.Mesh(archGeo, matBluedSteel)
      archMesh.position.set(-0.095, 0.086, 0)
      parts.dustCover.add(archMesh)

      const skirtGeo = new THREE.BoxGeometry(coverLength, 0.018, 0.061)
      const skirtMesh = new THREE.Mesh(skirtGeo, matBluedSteel)
      skirtMesh.position.set(-0.095, 0.084, 0)
      parts.dustCover.add(skirtMesh)

      for (let i = 0; i < 6; i++) {
        const rib = new THREE.Mesh(new THREE.TorusGeometry(0.0305, 0.0024, 8, 24, Math.PI), matDarkSteel)
        rib.rotation.y = Math.PI / 2
        rib.position.set(-0.27 + i * 0.056, 0.087, 0)
        parts.dustCover.add(rib)
      }

      const rearButton = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.016, 0.018), matBoltSteel)
      rearButton.position.set(-0.324, 0.092, 0)
      parts.dustCover.add(rearButton)
    })()

    // D. Bolt Carrier
    ;(function buildBoltCarrier() {
      const carrierBody = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.145, 20), matBoltSteel)
      carrierBody.rotation.z = Math.PI / 2
      carrierBody.position.set(0.035, 0.082, 0.019)
      parts.boltCarrier.add(carrierBody)

      const handleCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.035, 0.082, 0.026),
        new THREE.Vector3(0.033, 0.086, 0.048),
        new THREE.Vector3(0.028, 0.098, 0.062),
      ])
      const handleGeo = new THREE.TubeGeometry(handleCurve, 16, 0.0065, 12, false)
      parts.boltCarrier.add(new THREE.Mesh(handleGeo, matBoltSteel))

      const handleKnob = new THREE.Mesh(new THREE.SphereGeometry(0.008, 14, 12), matBoltSteel)
      handleKnob.position.set(0.028, 0.099, 0.063)
      parts.boltCarrier.add(handleKnob)
    })()

    // E. Pistol Grip
    ;(function buildPistolGrip() {
      const gripShape = new THREE.Shape()
      gripShape.moveTo(-0.265, 0.005)
      gripShape.lineTo(-0.205, 0.005)
      gripShape.lineTo(-0.245, -0.168)
      gripShape.quadraticCurveTo(-0.252, -0.182, -0.275, -0.18)
      gripShape.lineTo(-0.318, -0.172)
      gripShape.quadraticCurveTo(-0.33, -0.166, -0.322, -0.148)
      gripShape.quadraticCurveTo(-0.282, -0.07, -0.265, 0.005)
      gripShape.closePath()

      const gripGeo = new THREE.ExtrudeGeometry(gripShape, {
        steps: 2,
        depth: 0.034,
        bevelEnabled: true,
        bevelThickness: 0.009,
        bevelSize: 0.008,
        bevelSegments: 5,
      })
      gripGeo.translate(0, 0, -0.017)
      parts.grip.add(new THREE.Mesh(gripGeo, matBakelite))

      const ferrule = new THREE.Mesh(new THREE.BoxGeometry(0.064, 0.012, 0.044), matDarkSteel)
      ferrule.position.set(-0.236, 0.002, 0)
      parts.grip.add(ferrule)

      const gripCap = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.01, 0.036), matDarkSteel)
      gripCap.position.set(-0.298, -0.175, 0)
      gripCap.rotation.z = 0.2
      parts.grip.add(gripCap)
    })()

    // F. Handguard
    ;(function buildHandguard() {
      const matWoodLoft = matWood.clone()
      matWoodLoft.side = THREE.DoubleSide
      const NA = 8

      const sectionDown = (w: number, yb: number, yt: number, r: number) => {
        const cz = w - r,
          cy = yb + r,
          pts: [number, number][] = []
        pts.push([-w, yt], [-w, (yt + cy) / 2])
        for (let i = 0; i <= NA; i++) {
          const th = Math.PI + ((Math.PI / 2) * i) / NA
          pts.push([-cz + r * Math.cos(th), cy + r * Math.sin(th)])
        }
        for (let i = 0; i <= NA; i++) {
          const th = Math.PI * 1.5 + ((Math.PI / 2) * i) / NA
          pts.push([cz + r * Math.cos(th), cy + r * Math.sin(th)])
        }
        pts.push([w, (yt + cy) / 2], [w, yt], [0, yt])
        return pts
      }

      const sectionUp = (w: number, yb: number, yTop: number, r: number) => {
        const cz = w - r,
          cy = yTop - r,
          pts: [number, number][] = []
        pts.push([-w, yb], [-w, (yb + cy) / 2])
        for (let i = 0; i <= NA; i++) {
          const th = Math.PI - ((Math.PI / 2) * i) / NA
          pts.push([-cz + r * Math.cos(th), cy + r * Math.sin(th)])
        }
        for (let i = 0; i <= NA; i++) {
          const th = Math.PI / 2 - ((Math.PI / 2) * i) / NA
          pts.push([cz + r * Math.cos(th), cy + r * Math.sin(th)])
        }
        pts.push([w, (yb + cy) / 2], [w, yb], [0, yb])
        return pts
      }

      const loftXs = (x0: number, x1: number, n: number, eFront: number, eRear?: number) => {
        const xs: number[] = []
        for (let i = 0; i <= n; i++) xs.push(x0 + ((x1 - x0) * i) / n)
        for (let i = 1; i <= 10; i++) xs.push(x1 - (eFront * i) / 10)
        if (eRear) for (let i = 1; i <= 10; i++) xs.push(x0 + (eRear * i) / 10)
        xs.sort((a, b) => a - b)
        return xs.filter((x, i) => i === 0 || x - xs[i - 1] > 1e-5)
      }

      const buildLoft = (xs: number[], ringFn: (x: number) => [number, number][], material: THREE.Material) => {
        const pos: number[] = [],
          uv: number[] = [],
          idx: number[] = []
        let M = 0
        xs.forEach((x) => {
          const ring = ringFn(x)
          ring.push(ring[0])
          M = ring.length
          let s = 0
          ring.forEach((p, k) => {
            if (k > 0) s += Math.hypot(p[0] - ring[k - 1][0], p[1] - ring[k - 1][1])
            pos.push(x, p[1], p[0])
            uv.push(x, s)
          })
        })
        const nQ = xs.length - 1
        for (let q = 0; q < nQ; q++) {
          for (let k = 0; k < M - 1; k++) {
            const a = q * M + k,
              b = a + 1,
              c = a + M,
              d = c + 1
            idx.push(a, c, b, b, c, d)
          }
        }
        ;[0, nQ].forEach((q) => {
          const base = pos.length / 3
          let cy = 0
          for (let k = 0; k < M - 1; k++) cy += pos[(q * M + k) * 3 + 1]
          cy /= M - 1
          pos.push(pos[q * M * 3], cy, 0)
          uv.push(0, cy)
          for (let k = 0; k < M; k++) {
            const i = (q * M + k) * 3
            pos.push(pos[i], pos[i + 1], pos[i + 2])
            uv.push(pos[i + 2], pos[i + 1])
          }
          for (let k = 0; k < M - 1; k++) {
            if (q === 0) idx.push(base, base + 1 + k, base + 2 + k)
            else idx.push(base, base + 2 + k, base + 1 + k)
          }
        })
        const g = new THREE.BufferGeometry()
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
        g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
        g.setIndex(idx)
        g.computeVertexNormals()
        return new THREE.Mesh(g, material)
      }

      const L0 = 0.152,
        L1 = 0.494
      const lowerRing = (x: number) => {
        const u = (x - L0) / (L1 - L0)
        let w = 0.0255 + 0.0055 * Math.sin(Math.PI * Math.pow(u, 0.75))
        let yb = 0.012 - 0.01 * Math.sin(Math.PI * Math.pow(u, 0.8)) + 0.01 * Math.pow(u, 3)
        const yt = 0.06
        const e = 0.012,
          k = Math.min(1, Math.max(0, (x - (L1 - e)) / e))
        const inset = 0.4 * e * (1 - Math.sqrt(1 - k * k))
        w -= inset
        yb += inset
        const r = Math.min(0.02, (yt - yb) * 0.5, w * 0.85)
        return sectionDown(w, yb, yt, r)
      }
      parts.handguard.add(buildLoft(loftXs(L0, L1, 40, 0.012, 0), lowerRing, matWoodLoft))

      const U0 = 0.218,
        U1 = 0.492
      const upperRing = (x: number) => {
        let w = 0.029,
          yTop = 0.132
        const yb = 0.042
        const eF = 0.014,
          kF = Math.min(1, Math.max(0, (x - (U1 - eF)) / eF))
        const insetF = 0.45 * eF * (1 - Math.sqrt(1 - kF * kF))
        w -= insetF
        yTop -= insetF * 1.2
        const eR = 0.016,
          kR = Math.min(1, Math.max(0, (U0 + eR - x) / eR))
        yTop -= 0.013 * (1 - Math.sqrt(1 - kR * kR))
        const r = Math.min(0.02, w * 0.9)
        return sectionUp(w, yb, yTop, r)
      }
      parts.handguard.add(buildLoft(loftXs(U0, U1, 36, 0.014, 0.016), upperRing, matWoodLoft))

      const tubeCover = new THREE.Mesh(new THREE.CylinderGeometry(0.0185, 0.0185, 0.2, 32), matBarrelSteel)
      tubeCover.rotation.z = Math.PI / 2
      tubeCover.position.set(0.585, 0.098, 0)
      parts.handguard.add(tubeCover)

      const frontRetainer = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.042, 0.056), matDarkSteel)
      frontRetainer.position.set(0.502, 0.066, 0)
      parts.handguard.add(frontRetainer)
    })()

    // G. Barrel Assembly
    ;(function buildBarrelAssembly() {
      const gasGroup = new THREE.Group()
      gasGroup.position.x = 0.13
      parts.barrel.add(gasGroup)

      const barrelPts = [
        new THREE.Vector2(0.0, 0.16),
        new THREE.Vector2(0.018, 0.16),
        new THREE.Vector2(0.016, 0.52),
        new THREE.Vector2(0.0135, 0.54),
        new THREE.Vector2(0.0125, 0.94),
        new THREE.Vector2(0.0, 0.94),
      ]
      const barrelGeo = new THREE.LatheGeometry(barrelPts, 28)
      barrelGeo.rotateX(-Math.PI / 2)
      barrelGeo.rotateY(-Math.PI / 2)
      const barrelMesh = new THREE.Mesh(barrelGeo, matBarrelSteel)
      barrelMesh.position.set(0, 0.058, 0)
      parts.barrel.add(barrelMesh)

      const gasTube = new THREE.Mesh(new THREE.CylinderGeometry(0.0145, 0.0155, 0.47, 24), matBarrelDark)
      gasTube.rotation.z = Math.PI / 2
      gasTube.position.set(0.445, 0.098, 0)
      parts.barrel.add(gasTube)

      const cleaningRod = new THREE.Mesh(new THREE.CylinderGeometry(0.0032, 0.0032, 0.68, 12), matBoltSteel)
      cleaningRod.rotation.z = Math.PI / 2
      cleaningRod.position.set(0.54, 0.036, 0)
      parts.barrel.add(cleaningRod)

      // Gas block
      const gbSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.0235, 0.0235, 0.05, 36), matBarrelSteel)
      gbSleeve.rotation.z = Math.PI / 2
      gbSleeve.position.set(0.556, 0.058, 0)
      gasGroup.add(gbSleeve)

      const gbHousing = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.05, 0.034), matBarrelSteel)
      gbHousing.position.set(0.55, 0.095, 0)
      gbHousing.rotation.z = -0.08
      gasGroup.add(gbHousing)

      // Front sight
      const fsCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.0222, 0.0222, 0.052, 36), matBarrelSteel)
      fsCollar.rotation.z = Math.PI / 2
      fsCollar.position.set(0.888, 0.058, 0)
      parts.barrel.add(fsCollar)

      const blockShape = new THREE.Shape()
      blockShape.moveTo(0.866, 0.074)
      blockShape.lineTo(0.912, 0.074)
      blockShape.lineTo(0.903, 0.118)
      blockShape.lineTo(0.874, 0.118)
      blockShape.closePath()
      const blockGeo = new THREE.ExtrudeGeometry(blockShape, {
        depth: 0.022,
        bevelEnabled: true,
        bevelThickness: 0.004,
        bevelSize: 0.004,
        bevelSegments: 4,
      })
      blockGeo.translate(0, 0, -0.011)
      parts.barrel.add(new THREE.Mesh(blockGeo, matBarrelSteel))

      const fsPost = new THREE.Mesh(new THREE.BoxGeometry(0.0038, 0.04, 0.0038), matBoltSteel)
      fsPost.position.set(0.889, 0.141, 0)
      parts.barrel.add(fsPost)

      // Slant compensator muzzle brake
      const muzzleGroup = new THREE.Group()
      muzzleGroup.position.set(0.94, 0.058, 0)
      const muzzleCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.0155, 0.0155, 0.022, 24), matDarkSteel)
      muzzleCollar.rotation.z = Math.PI / 2
      muzzleCollar.position.x = 0.011
      muzzleGroup.add(muzzleCollar)

      const cR = 0.0145,
        cX0 = 0.022,
        cX1 = 0.054,
        cSlant = 0.016
      const frontX = (y: number) => cX1 - (cSlant * (y + cR)) / (2 * cR)
      const tubeGeo = new THREE.CylinderGeometry(cR, cR, cX1 - cX0, 40, 1, true)
      tubeGeo.rotateZ(-Math.PI / 2)
      tubeGeo.translate((cX0 + cX1) / 2, 0, 0)
      const paMuzzle = tubeGeo.attributes.position as THREE.BufferAttribute
      for (let k = 0; k < paMuzzle.count; k++) {
        if (paMuzzle.getX(k) > (cX0 + cX1) / 2) paMuzzle.setX(k, frontX(paMuzzle.getY(k)))
      }
      paMuzzle.needsUpdate = true
      tubeGeo.computeVertexNormals()
      muzzleGroup.add(new THREE.Mesh(tubeGeo, matDarkSteel))
      parts.barrel.add(muzzleGroup)
    })()

    // H. Magazine
    ;(function buildMagazine() {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.015, 0.032, 0),
        new THREE.Vector3(-0.019, -0.045, 0),
        new THREE.Vector3(-0.007, -0.12, 0),
        new THREE.Vector3(0.026, -0.19, 0),
        new THREE.Vector3(0.072, -0.245, 0),
      ])

      const SEG_U = 160,
        NF = 60,
        NA = 5,
        NR = 7
      const halfT = 0.0155,
        rc = 0.011,
        ribAmp = 0.0021
      const widthAt = (u: number) => 0.044 + 0.014 * u
      const fadeAt = (u: number) => Math.max(0, Math.min(1, (u - 0.11) / 0.05, (0.9 - u) / 0.05))
      const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
      const ridgeAt = (a: number, w: number, fu: number) => {
        const win = clamp01((0.9 * w - Math.abs(a)) / (0.1 * w))
        const x = (a + 0.8 * w) / (1.6 * w)
        const r = Math.pow(0.5 + 0.5 * Math.cos(2 * Math.PI * x * NR - Math.PI), 1.2)
        return r * win * fu
      }

      type OutlinePt = { a: number; b?: number; face: number }
      const outline = (w: number): OutlinePt[] => {
        const pts: OutlinePt[] = []
        const ca = w - rc,
          cb = halfT - rc
        for (let k = 0; k <= NF; k++) pts.push({ a: -ca + (2 * ca * k) / NF, face: 1 })
        for (let k = 1; k <= NA; k++) {
          const th = (Math.PI / 2) * (1 - k / NA)
          pts.push({ a: ca + rc * Math.cos(th), b: cb + rc * Math.sin(th), face: 0 })
        }
        for (let k = 0; k <= NA; k++) {
          const th = (-Math.PI / 2) * (k / NA)
          pts.push({ a: ca + rc * Math.cos(th), b: -cb + rc * Math.sin(th), face: 0 })
        }
        for (let k = 0; k <= NF; k++) pts.push({ a: ca - (2 * ca * k) / NF, face: -1 })
        for (let k = 1; k <= NA; k++) {
          const th = -Math.PI / 2 - (Math.PI / 2) * (k / NA)
          pts.push({ a: -ca + rc * Math.cos(th), b: -cb + rc * Math.sin(th), face: 0 })
        }
        for (let k = 0; k < NA; k++) {
          const th = Math.PI - (Math.PI / 2) * (k / NA)
          pts.push({ a: -ca + rc * Math.cos(th), b: cb + rc * Math.sin(th), face: 0 })
        }
        return pts
      }

      const M = outline(0.05).length
      const positions: number[] = [],
        colors: number[] = [],
        indices: number[] = []
      for (let q = 0; q <= SEG_U; q++) {
        const u = q / SEG_U
        const P = curve.getPointAt(u),
          T = curve.getTangentAt(u)
        const Nx = -T.y,
          Ny = T.x
        const w = widthAt(u),
          fu = fadeAt(u)
        outline(w).forEach((pt) => {
          let b = pt.b ?? 0,
            shade = 0.8
          if (pt.face !== 0) {
            const rd = ridgeAt(pt.a, w, fu)
            b = pt.face * (halfT + ribAmp * rd)
            shade = 0.8 + 0.2 * rd
          }
          positions.push(P.x + Nx * pt.a, P.y + Ny * pt.a, b)
          colors.push(shade, shade, shade)
        })
      }
      for (let q = 0; q < SEG_U; q++) {
        for (let c = 0; c < M; c++) {
          const c2 = (c + 1) % M
          const v0 = q * M + c,
            v1 = q * M + c2
          const v2 = (q + 1) * M + c,
            v3 = (q + 1) * M + c2
          indices.push(v0, v2, v1, v1, v2, v3)
        }
      }
      const magGeo = new THREE.BufferGeometry()
      magGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      magGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
      magGeo.setIndex(indices)
      magGeo.computeVertexNormals()
      const magMesh = new THREE.Mesh(
        magGeo,
        new THREE.MeshPhysicalMaterial({
          color: 0x3a3b3f,
          vertexColors: true,
          metalness: 0.5,
          roughness: 0.55,
          clearcoat: 0.05,
          envMapIntensity: 0.8,
          side: THREE.DoubleSide,
        })
      )
      parts.magazine.add(magMesh)

      const endPt = curve.getPointAt(1)
      const endTan = curve.getTangentAt(1)
      const endAngle = Math.atan2(endTan.y, endTan.x) + Math.PI / 2
      const floorPlate = new THREE.Mesh(new THREE.BoxGeometry(0.124, 0.014, 0.043), matMagBase)
      floorPlate.position.copy(endPt)
      floorPlate.rotation.z = endAngle
      parts.magazine.add(floorPlate)

      const seatedCart = createDecorativeCartridge()
      seatedCart.rotation.z = -Math.PI / 2 + 0.08
      seatedCart.position.set(-0.058, 0.036, 0)
      parts.magazine.add(seatedCart)

      for (let i = 0; i < 3; i++) {
        const displayCart = createDecorativeCartridge()
        displayCart.scale.setScalar(1.35)
        displayCart.position.set(0.16 + i * 0.055, -0.14 + i * 0.018, 0.06)
        displayCart.rotation.z = -0.22
        parts.showcaseCartridges.add(displayCart)
      }
      parts.showcaseCartridges.visible = false
    })()

    Object.values(parts).forEach(applyShadows)

    // Muzzle Flash
    const muzzleFlashGroup = new THREE.Group()
    muzzleFlashGroup.position.set(1.01, 0.058, 0)
    muzzleFlashGroup.visible = false
    recoilGroup.add(muzzleFlashGroup)

    const flashLight = new THREE.PointLight(0xffaa33, 0, 3.2)
    flashLight.position.set(0.08, 0, 0)
    muzzleFlashGroup.add(flashLight)

    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffd166,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const coreCone = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.24, 16), flashMat)
    coreCone.rotation.z = -Math.PI / 2
    coreCone.position.x = 0.12
    muzzleFlashGroup.add(coreCone)

    // Casings pool
    const activeCasings: {
      mesh: THREE.Mesh
      vel: THREE.Vector3
      rotVel: THREE.Vector3
      life: number
      maxLife: number
    }[] = []

    function spawnDecorativeCasing() {
      const casing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.009, 0.056, 14),
        new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2, transparent: true, opacity: 1 })
      )
      const worldPos = new THREE.Vector3(0.03, 0.088, 0.042)
      recoilGroup.localToWorld(worldPos)
      casing.position.copy(worldPos)
      casing.rotation.set(Math.random() * 2, Math.random() * 2, Math.PI / 2)
      scene.add(casing)
      activeCasings.push({
        mesh: casing,
        vel: new THREE.Vector3(
          -0.25 + (Math.random() - 0.5) * 0.2,
          0.95 + Math.random() * 0.35,
          1.15 + Math.random() * 0.35
        ),
        rotVel: new THREE.Vector3((Math.random() - 0.5) * 18, (Math.random() - 0.5) * 18, 14 + Math.random() * 8),
        life: 0,
        maxLife: 1.15,
      })
    }

    // Audio
    let audioCtx: AudioContext | null = null
    function playFiringSound() {
      if (!soundRef.current) return
      try {
        const AudioClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        if (!audioCtx) audioCtx = new AudioClass()
        if (audioCtx.state === 'suspended') audioCtx.resume()

        const now = audioCtx.currentTime
        const osc = audioCtx.createOscillator()
        const oscGain = audioCtx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(165, now)
        osc.frequency.exponentialRampToValueAtTime(34, now + 0.16)
        oscGain.gain.setValueAtTime(0.65, now)
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.19)
        osc.connect(oscGain)
        oscGain.connect(audioCtx.destination)
        osc.start(now)
        osc.stop(now + 0.2)

        const bufferSize = Math.floor(audioCtx.sampleRate * 0.24)
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate)
        const data = noiseBuffer.getChannelData(0)
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.045))
        }
        const noise = audioCtx.createBufferSource()
        noise.buffer = noiseBuffer
        const filter = audioCtx.createBiquadFilter()
        filter.type = 'bandpass'
        filter.frequency.setValueAtTime(1150, now)
        filter.Q.setValueAtTime(0.9, now)
        const noiseGain = audioCtx.createGain()
        noiseGain.gain.setValueAtTime(0.7, now)
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24)
        noise.connect(filter)
        filter.connect(noiseGain)
        noiseGain.connect(audioCtx.destination)
        noise.start(now)
      } catch {
        // audio fail-safe
      }
    }

    // Floating Labels
    const labelConfigs = [
      { text: "Qo'ndoq", targetObj: parts.buttstock, localOffset: new THREE.Vector3(-0.62, -0.02, 0), mode: 'explode' },
      { text: "Korpus qopqog'i", targetObj: parts.dustCover, localOffset: new THREE.Vector3(-0.1, 0.13, 0), mode: 'explode' },
      { text: 'Korpus va tepkilik', targetObj: parts.receiver, localOffset: new THREE.Vector3(-0.12, 0.04, 0.04), mode: 'explode' },
      { text: 'Dastak', targetObj: parts.grip, localOffset: new THREE.Vector3(-0.27, -0.1, 0), mode: 'explode' },
      { text: 'Old qoplama (Tsek)', targetObj: parts.handguard, localOffset: new THREE.Vector3(0.36, 0.12, 0), mode: 'explode' },
      { text: 'Stvol va nishon moslamasi', targetObj: parts.barrel, localOffset: new THREE.Vector3(0.76, 0.1, 0), mode: 'explode' },
      { text: 'Olinadigan magazin', targetObj: parts.magazine, localOffset: new THREE.Vector3(0.03, -0.16, 0), mode: 'explode' },
      { text: 'Magazin va patronlar', targetObj: parts.magazine, localOffset: new THREE.Vector3(0.11, 0.06, 0.04), mode: 'magazine' },
    ]

    labelsLayer.innerHTML = ''
    const labelElements = labelConfigs.map((cfg) => {
      const el = document.createElement('div')
      el.className = 'viewer-3d-label'
      el.innerHTML = `<span class="viewer-3d-dot"></span><span>${cfg.text}</span>`
      labelsLayer.appendChild(el)
      return { ...cfg, el }
    })

    // Animation target offsets
    const partTargets = {
      buttstock: { pos: new THREE.Vector3(0, 0, 0), rot: new THREE.Vector3(0, 0, 0) },
      dustCover: { pos: new THREE.Vector3(0, 0, 0), rot: new THREE.Vector3(0, 0, 0) },
      boltCarrier: { pos: new THREE.Vector3(0, 0, 0), rot: new THREE.Vector3(0, 0, 0) },
      grip: { pos: new THREE.Vector3(0, 0, 0), rot: new THREE.Vector3(0, 0, 0) },
      handguard: { pos: new THREE.Vector3(0, 0, 0), rot: new THREE.Vector3(0, 0, 0) },
      barrel: { pos: new THREE.Vector3(0, 0, 0), rot: new THREE.Vector3(0, 0, 0) },
      magazine: { pos: new THREE.Vector3(0, 0, 0), rot: new THREE.Vector3(0, 0, 0) },
      riflePos: new THREE.Vector3(0, 0, 0),
    }

    let activeMode: 'free' | 'explode' | 'magazine' = 'free'
    let cameraLerpActive = false
    const desiredCamPos = DEFAULT_CAM_POS.clone()
    const desiredTarget = DEFAULT_TARGET.clone()

    let recoilImpulse = 0
    let boltImpulse = 0
    let flashTimer = 0

    function setMode(newMode: 'free' | 'explode' | 'magazine') {
      activeMode = newMode
      setModeState(newMode)

      partTargets.buttstock.pos.set(0, 0, 0)
      partTargets.dustCover.pos.set(0, 0, 0)
      partTargets.boltCarrier.pos.set(0, 0, 0)
      partTargets.grip.pos.set(0, 0, 0)
      partTargets.handguard.pos.set(0, 0, 0)
      partTargets.barrel.pos.set(0, 0, 0)
      partTargets.magazine.pos.set(0, 0, 0)
      partTargets.magazine.rot.set(0, 0, 0)
      partTargets.riflePos.set(0, 0, 0)
      parts.showcaseCartridges.visible = false

      if (newMode === 'free') {
        desiredCamPos.copy(DEFAULT_CAM_POS)
        desiredTarget.copy(DEFAULT_TARGET)
        cameraLerpActive = true
      } else if (newMode === 'explode') {
        partTargets.buttstock.pos.set(-0.28, -0.02, 0)
        partTargets.dustCover.pos.set(-0.04, 0.22, 0)
        partTargets.boltCarrier.pos.set(0.04, 0.11, 0.04)
        partTargets.grip.pos.set(-0.06, -0.22, 0)
        partTargets.handguard.pos.set(0.18, 0.14, 0)
        partTargets.barrel.pos.set(0.32, 0.0, 0)
        partTargets.magazine.pos.set(0.02, -0.26, 0)

        desiredCamPos.set(0.04, 0.08, 2.75)
        desiredTarget.set(0.04, 0.0, 0)
        cameraLerpActive = true
      } else if (newMode === 'magazine') {
        partTargets.riflePos.set(-0.15, 0.12, -0.35)
        partTargets.magazine.pos.set(0.16, -0.18, 0.42)
        partTargets.magazine.rot.set(0.12, -0.35, 0.18)
        parts.showcaseCartridges.visible = true

        desiredCamPos.set(0.24, -0.12, 1.32)
        desiredTarget.set(0.12, -0.22, 0.08)
        cameraLerpActive = true
      }
    }

    function triggerFireAnimation() {
      if (activeMode === 'magazine') {
        setMode('free')
      }
      recoilImpulse = 1.0
      boltImpulse = 1.0
      flashTimer = 0.065
      muzzleFlashGroup.visible = true
      muzzleFlashGroup.rotation.x = Math.random() * Math.PI * 2
      flashLight.intensity = 5.5

      spawnDecorativeCasing()
      playFiringSound()
    }

    controls.addEventListener('start', () => {
      cameraLerpActive = false
    })

    setModeRef.current = setMode
    triggerFireRef.current = triggerFireAnimation
    resetCameraRef.current = () => setMode('free')

    // Animation Loop
    const clock = new THREE.Clock()
    const tempProjVec = new THREE.Vector3()
    let reqId = 0

    function updateFloatingLabels() {
      const curW = container!.clientWidth
      const curH = container!.clientHeight
      const widthHalf = curW / 2
      const heightHalf = curH / 2

      labelConfigs.forEach((cfg, idx) => {
        const item = labelElements[idx]
        const isVisible = cfg.mode === activeMode
        item.el.classList.toggle('visible', isVisible)

        if (!isVisible) return

        tempProjVec.copy(cfg.localOffset)
        cfg.targetObj.localToWorld(tempProjVec)
        tempProjVec.project(camera)

        if (tempProjVec.z > 1) {
          item.el.classList.remove('visible')
          return
        }

        const x = tempProjVec.x * widthHalf + widthHalf
        const y = -(tempProjVec.y * heightHalf) + heightHalf
        item.el.style.left = `${x}px`
        item.el.style.top = `${y}px`
      })
    }

    function animate() {
      reqId = requestAnimationFrame(animate)

      const dt = Math.min(clock.getDelta(), 0.05)
      const damp = 1 - Math.exp(-7.5 * dt)

      parts.buttstock.position.lerp(partTargets.buttstock.pos, damp)
      parts.dustCover.position.lerp(partTargets.dustCover.pos, damp)
      parts.grip.position.lerp(partTargets.grip.pos, damp)
      parts.handguard.position.lerp(partTargets.handguard.pos, damp)
      parts.barrel.position.lerp(partTargets.barrel.pos, damp)
      parts.magazine.position.lerp(partTargets.magazine.pos, damp)

      parts.magazine.rotation.x = THREE.MathUtils.lerp(parts.magazine.rotation.x, partTargets.magazine.rot.x, damp)
      parts.magazine.rotation.y = THREE.MathUtils.lerp(parts.magazine.rotation.y, partTargets.magazine.rot.y, damp)
      parts.magazine.rotation.z = THREE.MathUtils.lerp(parts.magazine.rotation.z, partTargets.magazine.rot.z, damp)

      rifleRoot.position.lerp(partTargets.riflePos, damp)

      const elapsed = clock.getElapsedTime()
      if (activeMode === 'magazine') {
        parts.showcaseCartridges.position.set(0.14, -0.15 + Math.sin(elapsed * 2.2) * 0.008, 0.36)
        parts.showcaseCartridges.rotation.y = Math.sin(elapsed * 1.4) * 0.18
      }

      if (recoilImpulse > 0.001) {
        recoilImpulse = THREE.MathUtils.lerp(recoilImpulse, 0, 1 - Math.exp(-16 * dt))
      } else {
        recoilImpulse = 0
      }

      if (boltImpulse > 0.001) {
        boltImpulse = THREE.MathUtils.lerp(boltImpulse, 0, 1 - Math.exp(-20 * dt))
      } else {
        boltImpulse = 0
      }

      recoilGroup.position.x = -recoilImpulse * 0.048
      recoilGroup.rotation.z = recoilImpulse * 0.032

      const boltTargetX = partTargets.boltCarrier.pos.x - boltImpulse * 0.095
      parts.boltCarrier.position.x = THREE.MathUtils.lerp(parts.boltCarrier.position.x, boltTargetX, 0.45)
      parts.boltCarrier.position.y = THREE.MathUtils.lerp(parts.boltCarrier.position.y, partTargets.boltCarrier.pos.y, damp)
      parts.boltCarrier.position.z = THREE.MathUtils.lerp(parts.boltCarrier.position.z, partTargets.boltCarrier.pos.z, damp)

      if (flashTimer > 0) {
        flashTimer -= dt
        const ratio = Math.max(0, flashTimer / 0.065)
        flashLight.intensity = ratio * 5.5
        muzzleFlashGroup.scale.setScalar(0.7 + ratio * 0.55)
        if (flashTimer <= 0) {
          muzzleFlashGroup.visible = false
          flashLight.intensity = 0
        }
      }

      for (let i = activeCasings.length - 1; i >= 0; i--) {
        const c = activeCasings[i]
        c.life += dt
        c.vel.y -= 4.2 * dt
        c.mesh.position.addScaledVector(c.vel, dt)
        c.mesh.rotation.x += c.rotVel.x * dt
        c.mesh.rotation.y += c.rotVel.y * dt
        c.mesh.rotation.z += c.rotVel.z * dt

        const remaining = 1 - c.life / c.maxLife
        ;(c.mesh.material as THREE.Material).opacity = Math.max(0, remaining)

        if (c.life >= c.maxLife) {
          scene.remove(c.mesh)
          c.mesh.geometry.dispose()
          ;(c.mesh.material as THREE.Material).dispose()
          activeCasings.splice(i, 1)
        }
      }

      if (cameraLerpActive) {
        const camDamp = 1 - Math.exp(-6.0 * dt)
        camera.position.lerp(desiredCamPos, camDamp)
        controls.target.lerp(desiredTarget, camDamp)
        if (camera.position.distanceTo(desiredCamPos) < 0.005 && controls.target.distanceTo(desiredTarget) < 0.005) {
          camera.position.copy(desiredCamPos)
          controls.target.copy(desiredTarget)
          cameraLerpActive = false
        }
      }

      controls.update()
      updateFloatingLabels()
      renderer.render(scene, camera)
    }

    animate()

    // Resize observer
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect
        if (cr.width > 0 && cr.height > 0) {
          camera.aspect = cr.width / cr.height
          camera.updateProjectionMatrix()
          renderer.setSize(cr.width, cr.height)
        }
      }
    })
    ro.observe(container)

    return () => {
      cancelAnimationFrame(reqId)
      ro.disconnect()
      controls.dispose()
      renderer.dispose()
      if (audioCtx) {
        try {
          audioCtx.close()
        } catch {
          // ignore
        }
      }
    }
  }, [])

  return (
    <div className={`viewer-3d-root ${className}`}>
      {/* 3D Canvas Mount Point */}
      <div ref={containerRef} className="viewer-3d-canvas" />

      {/* Floating 3D Uzbek labels */}
      <div ref={labelsRef} className="viewer-3d-labels-layer" />

      {/* Control Buttons Bar */}
      <div className="viewer-3d-controls">
        <button
          type="button"
          className={`viewer-btn ${mode === 'free' ? 'active' : ''}`}
          onClick={() => setModeRef.current('free')}
          title="Erkin ko'rish"
        >
          <RotateCw size={14} />
          <span>360° Erkin</span>
        </button>

        <button
          type="button"
          className={`viewer-btn ${mode === 'explode' ? 'active' : ''}`}
          onClick={() => setModeRef.current(mode === 'explode' ? 'free' : 'explode')}
          title="Qismlarni ko'rish"
        >
          <Layers size={14} />
          <span>Qismlar</span>
        </button>

        <button
          type="button"
          className={`viewer-btn ${mode === 'magazine' ? 'active' : ''}`}
          onClick={() => setModeRef.current(mode === 'magazine' ? 'free' : 'magazine')}
          title="Magazinni ko'rish"
        >
          <Box size={14} />
          <span>Magazin</span>
        </button>

        <button
          type="button"
          className="viewer-btn fire-btn"
          onClick={() => triggerFireRef.current()}
          title="Otish animatsiyasi va ovoz"
        >
          <Flame size={14} />
          <span>Otish</span>
        </button>

        <button
          type="button"
          className={`viewer-btn ${soundOn ? 'sound-on' : 'sound-off'}`}
          onClick={() => setSoundOn((s) => !s)}
          title={soundOn ? 'Ovozni o‘chirish' : 'Ovozni yoqish'}
        >
          {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
        </button>

        <button
          type="button"
          className="viewer-btn"
          onClick={() => resetCameraRef.current()}
          title="Asl ko'rinishga qaytarish"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  )
}

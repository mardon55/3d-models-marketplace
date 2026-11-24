import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { autoFitModel, enhanceModelVisuals } from '../utils/autoFitModel'

interface Shared3DCanvasProps {
  isDetailOpen: boolean
}

type ModelItem = {
  scene: THREE.Scene
  wrapper: THREE.Group
  camera: THREE.PerspectiveCamera
  glbUrl: string
  lastUsed: number
}

export function Shared3DCanvas({ isDetailOpen }: Shared3DCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isDetailOpenRef = useRef(isDetailOpen)
  isDetailOpenRef.current = isDetailOpen

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let isDisposed = false
    let animationFrameId: number | null = null

    // 1. Single Shared WebGLRenderer
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      })
    } catch (e) {
      console.error('Failed to create Shared WebGLRenderer:', e)
      return
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.0))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.25
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setScissorTest(true)

    // Pre-generate shared studio environment map (RoomEnvironment) for rich PBR reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    pmremGenerator.compileEquirectangularShader()
    const roomEnv = new RoomEnvironment()
    const envTexture = pmremGenerator.fromScene(roomEnv, 0.04).texture

    // Handle resize
    const handleResize = () => {
      if (isDisposed || !renderer) return
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.0))
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderFrame(0)
    }
    window.addEventListener('resize', handleResize)

    // Handle context loss & restoration
    const handleContextLost = (e: Event) => {
      e.preventDefault()
      console.warn('WebGL context lost, pausing Shared3DCanvas')
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
    const handleContextRestored = () => {
      console.info('WebGL context restored, restarting Shared3DCanvas')
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.0))
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setScissorTest(true)
      animate()
    }
    canvas.addEventListener('webglcontextlost', handleContextLost)
    canvas.addEventListener('webglcontextrestored', handleContextRestored)

    // 2. Setup GLTF & Draco Loader
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/draco/')
    const gltfLoader = new GLTFLoader()
    gltfLoader.setDRACOLoader(dracoLoader)

    // Model cache & active elements registry
    const modelCache = new Map<string, ModelItem>()
    const loadingSet = new Set<string>()
    const enqueuedSet = new Set<string>()
    const failedSet = new Set<string>()
    const inViewElements = new Set<HTMLElement>()

    // Loading queue: max concurrent downloads
    const isMobile = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0
    const MAX_CONCURRENT = isMobile ? 2 : 4
    let activeDownloads = 0
    const loadQueue: { url: string; element: HTMLElement }[] = []

    // LRU cache limit (maximum 28 live 3D models in memory)
    const MAX_CACHED_MODELS = 28
    function pruneCacheIfNeeded() {
      if (modelCache.size <= MAX_CACHED_MODELS) return
      const visibleUrls = new Set<string>()
      inViewElements.forEach((el) => {
        const u = el.getAttribute('data-card-glb')
        if (u) visibleUrls.add(u)
      })

      let oldestUrl: string | null = null
      let oldestTime = Infinity
      modelCache.forEach((item, u) => {
        if (!visibleUrls.has(u) && item.lastUsed < oldestTime) {
          oldestTime = item.lastUsed
          oldestUrl = u
        }
      })

      if (oldestUrl) {
        const item = modelCache.get(oldestUrl)
        if (item) {
          item.scene.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
              const m = obj as THREE.Mesh
              if (m.geometry) m.geometry.dispose()
              if (Array.isArray(m.material)) m.material.forEach((mat) => mat.dispose())
              else if (m.material) m.material.dispose()
            }
          })
          modelCache.delete(oldestUrl)
        }
      }
    }

    function markLoaded(url: string) {
      document.querySelectorAll<HTMLElement>(`[data-card-glb="${url}"]`).forEach((el) => {
        el.setAttribute('data-loaded', 'true')
        el.dispatchEvent(new CustomEvent('glb-loaded', { bubbles: true }))
      })
    }

    function enqueueModel(url: string, el: HTMLElement) {
      if (!url || failedSet.has(url)) return
      if (modelCache.has(url)) {
        el.setAttribute('data-loaded', 'true')
        el.dispatchEvent(new CustomEvent('glb-loaded', { bubbles: true }))
        return
      }
      if (loadingSet.has(url) || enqueuedSet.has(url)) return
      enqueuedSet.add(url)
      loadQueue.push({ url, element: el })
      pumpQueue()
    }

    function pumpQueue() {
      if (isDisposed) return
      while (activeDownloads < MAX_CONCURRENT && loadQueue.length > 0) {
        const item = loadQueue.shift()
        if (!item) break
        const { url } = item

        if (modelCache.has(url) || loadingSet.has(url)) {
          enqueuedSet.delete(url)
          if (modelCache.has(url)) {
            markLoaded(url)
          }
          continue
        }

        activeDownloads++
        loadingSet.add(url)
        enqueuedSet.delete(url)

        gltfLoader.load(
          url,
          (gltf) => {
            activeDownloads--
            loadingSet.delete(url)
            if (isDisposed) return

            const root = gltf.scene

            // 1. Crystal-clear visuals & material optimization
            enhanceModelVisuals(root, renderer, 8)

            // 2. Intelligent AutoFitModel: true 3D three-quarter view, dead-center placement
            const wrapper = new THREE.Group()
            wrapper.add(root)

            const fit = autoFitModel(root, wrapper, {
              fov: 34,
              aspect: 1.5,
              padding: 0.82,
              cameraDistance: 3.5,
              cameraPitch: 0.35, // ~20° elevation
              cameraYaw: 0.58,   // ~33° azimuth
            })

            // 3. Studio lighting + PBR RoomEnvironment reflections
            const cardScene = new THREE.Scene()
            cardScene.environment = envTexture

            const ambient = new THREE.AmbientLight(0xffffff, 1.4)
            const keyLight = new THREE.DirectionalLight(0xfff8ee, 2.6)
            keyLight.position.set(5, 8, 6)
            const fillLight = new THREE.DirectionalLight(0xc2b0ff, 1.4)
            fillLight.position.set(-5, 3, -3)
            const rimLight = new THREE.DirectionalLight(0xe0d4ff, 1.6)
            rimLight.position.set(0, 6, -5)

            cardScene.add(ambient, keyLight, fillLight, rimLight, wrapper)

            const camera = new THREE.PerspectiveCamera(34, 1.5, 0.1, 50)
            camera.position.copy(fit.cameraPosition)
            camera.lookAt(fit.cameraTarget)

            modelCache.set(url, {
              scene: cardScene,
              wrapper,
              camera,
              glbUrl: url,
              lastUsed: performance.now(),
            })

            pruneCacheIfNeeded()

            // Instantly mark loaded so loading text/spinner vanishes
            markLoaded(url)

            pumpQueue()
          },
          (progress) => {
            if (progress.total > 0) {
              const pct = Math.round((progress.loaded / progress.total) * 100)
              document.querySelectorAll<HTMLElement>(`[data-card-glb="${url}"]`).forEach((el) => {
                el.setAttribute('data-progress', String(pct))
              })
            }
          },
          (err) => {
            activeDownloads--
            loadingSet.delete(url)
            enqueuedSet.delete(url)
            failedSet.add(url)
            console.error('Failed to load card GLB:', url, err)
            document.querySelectorAll<HTMLElement>(`[data-card-glb="${url}"]`).forEach((el) => {
              el.setAttribute('data-error', 'true')
              el.dispatchEvent(new CustomEvent('glb-error', { bubbles: true }))
            })
            pumpQueue()
          }
        )
      }
    }

    // 3. IntersectionObserver: Viewport divlarni kuzatish
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const target = entry.target as HTMLElement
          if (entry.isIntersecting) {
            inViewElements.add(target)
            const glbUrl = target.getAttribute('data-card-glb')
            if (glbUrl) {
              enqueueModel(glbUrl, target)
            }
          } else {
            inViewElements.delete(target)
          }
        }
      },
      {
        root: null,
        rootMargin: '180px',
        threshold: 0.01,
      }
    )

    // MutationObserver to observe newly mounted card viewports
    const mutationObserver = new MutationObserver(() => {
      const viewports = document.querySelectorAll<HTMLElement>('.card-3d-viewport')
      viewports.forEach((vp) => {
        observer.observe(vp)
        const url = vp.getAttribute('data-card-glb')
        if (url && modelCache.has(url)) {
          vp.setAttribute('data-loaded', 'true')
          vp.dispatchEvent(new CustomEvent('glb-loaded', { bubbles: true }))
        }
      })
    })

    mutationObserver.observe(document.body, { childList: true, subtree: true })
    document.querySelectorAll<HTMLElement>('.card-3d-viewport').forEach((vp) => observer.observe(vp))

    // 4. Scissor Rendering Function (shared by animate loop and scroll listener)
    const clock = new THREE.Clock()
    const ROTATION_SPEED = 0.55 // ~0.55 rad/s

    const renderFrame = (delta = 0) => {
      if (isDisposed || !renderer) return

      if (document.hidden || isDetailOpenRef.current || inViewElements.size === 0) {
        renderer.setScissor(0, 0, window.innerWidth, window.innerHeight)
        renderer.setViewport(0, 0, window.innerWidth, window.innerHeight)
        renderer.setScissorTest(false)
        renderer.clear()
        renderer.setScissorTest(true)
        return
      }

      const canvasWidth = canvas.clientWidth || window.innerWidth
      const canvasHeight = canvas.clientHeight || window.innerHeight

      // Clear full canvas before drawing card viewports
      renderer.setScissor(0, 0, canvasWidth, canvasHeight)
      renderer.setViewport(0, 0, canvasWidth, canvasHeight)
      renderer.setScissorTest(false)
      renderer.clear()
      renderer.setScissorTest(true)

      const now = performance.now()
      const rotatedItems = new Set<ModelItem>()

      for (const el of inViewElements) {
        if (!el.isConnected) {
          inViewElements.delete(el)
          continue
        }

        const rect = el.getBoundingClientRect()
        // Skip if entirely outside canvas
        if (rect.bottom <= 0 || rect.top >= canvasHeight || rect.right <= 0 || rect.left >= canvasWidth) {
          continue
        }

        const glbUrl = el.getAttribute('data-card-glb')
        if (!glbUrl) continue

        const item = modelCache.get(glbUrl)
        if (!item) continue

        item.lastUsed = now

        // Ensure loaded attribute is stamped so loading UI never lingers
        if (el.getAttribute('data-loaded') !== 'true') {
          el.setAttribute('data-loaded', 'true')
          el.dispatchEvent(new CustomEvent('glb-loaded', { bubbles: true }))
        }

        const vx = Math.round(rect.left)
        const vy = Math.round(canvasHeight - rect.bottom)
        const vw = Math.round(rect.width)
        const vh = Math.round(rect.height)

        if (vw <= 0 || vh <= 0) continue

        // Strictly clamp scissor bounds inside canvas
        const sx = Math.max(0, vx)
        const sy = Math.max(0, vy)
        const sr = Math.min(canvasWidth, vx + vw)
        const st = Math.min(canvasHeight, vy + vh)
        const sw = sr - sx
        const sh = st - sy

        if (sw <= 0 || sh <= 0) continue

        renderer.setViewport(vx, vy, vw, vh)
        renderer.setScissor(sx, sy, sw, sh)

        // Continuous Y-axis rotation
        if (delta > 0 && !rotatedItems.has(item)) {
          item.wrapper.rotation.y += ROTATION_SPEED * delta
          rotatedItems.add(item)
        }

        const cardAspect = vw / vh
        if (Math.abs(item.camera.aspect - cardAspect) > 0.01) {
          item.camera.aspect = cardAspect
          item.camera.updateProjectionMatrix()
        }

        renderer.render(item.scene, item.camera)
      }
    }

    // Scroll listener: guarantees scissor positions update in lockstep with page scroll
    const handleScroll = () => {
      renderFrame(0)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    const animate = () => {
      if (isDisposed) return
      animationFrameId = requestAnimationFrame(animate)
      const delta = Math.min(clock.getDelta(), 0.1)
      renderFrame(delta)
    }

    animate()

    // 5. Cleanup
    return () => {
      isDisposed = true
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll)
      canvas.removeEventListener('webglcontextlost', handleContextLost)
      canvas.removeEventListener('webglcontextrestored', handleContextRestored)
      observer.disconnect()
      mutationObserver.disconnect()

      // Dispose PMREM texture & generator
      try {
        envTexture.dispose()
        pmremGenerator.dispose()
      } catch (_) {}

      // Dispose loaded cache geometries & materials
      modelCache.forEach((item) => {
        item.scene.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const m = obj as THREE.Mesh
            if (m.geometry) m.geometry.dispose()
            if (Array.isArray(m.material)) {
              m.material.forEach((mat) => mat.dispose())
            } else if (m.material) {
              m.material.dispose()
            }
          }
        })
      })
      modelCache.clear()

      try {
        renderer.dispose()
      } catch (_) {}
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="shared-3d-canvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5,
        display: isDetailOpen ? 'none' : 'block',
      }}
      aria-hidden="true"
    />
  )
}

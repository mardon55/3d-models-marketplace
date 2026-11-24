import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { RotateCw, RotateCcw, Box, Eye, Sun, Sparkles } from 'lucide-react'
import { autoFitModel, enhanceModelVisuals } from '../utils/autoFitModel'

interface GLBModelViewerProps {
  glbUrl: string
  productName: string
  className?: string
}

export function GLBModelViewer({ glbUrl, productName, className = '' }: GLBModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [autoRotate, setAutoRotate] = useState(true)
  const [wireframe, setWireframe] = useState(false)
  const [polyCount, setPolyCount] = useState<number | null>(null)

  const controlsRef = useRef<OrbitControls | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const modelRef = useRef<THREE.Group | null>(null)
  const resetCameraRef = useRef<() => void>(() => {})

  // Wireframe toggle effect
  useEffect(() => {
    if (!modelRef.current) return
    modelRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat) => {
            mat.wireframe = wireframe
          })
        } else if (mesh.material) {
          mesh.material.wireframe = wireframe
        }
      }
    })
  }, [wireframe])

  // Auto-rotate toggle effect
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate
    }
  }, [autoRotate])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    setLoading(true)
    setProgress(0)
    setLoadError(null)

    // Dimensions
    const width = container.clientWidth || 400
    const height = container.clientHeight || 300

    // Scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.05, 500)
    camera.position.set(0, 1.2, 3.5)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    container.innerHTML = ''
    container.appendChild(renderer.domElement)

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.autoRotate = autoRotate
    controls.autoRotateSpeed = 1.6
    controls.maxPolarAngle = Math.PI * 0.95
    controls.minDistance = 0.3
    controls.maxDistance = 50
    controlsRef.current = controls

    // Pre-generate studio PBR environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    pmremGenerator.compileEquirectangularShader()
    const roomEnv = new RoomEnvironment()
    const envTexture = pmremGenerator.fromScene(roomEnv, 0.04).texture
    scene.environment = envTexture

    // Studio Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xfff5ea, 2.5)
    keyLight.position.set(5, 8, 5)
    keyLight.castShadow = true
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0xb0d0ff, 1.4)
    fillLight.position.set(-5, 4, -3)
    scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0xd9b3ff, 1.5)
    rimLight.position.set(0, 6, -4)
    scene.add(rimLight)

    // Soft reflective ground circle / shadow receiver
    const shadowGeo = new THREE.CircleGeometry(3, 32)
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x0b0620,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    })
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat)
    shadowMesh.rotation.x = -Math.PI / 2
    shadowMesh.position.y = -0.5
    scene.add(shadowMesh)

    // Load GLTF / GLB model with Draco decoder
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/draco/')
    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)
    let initialCamPos = new THREE.Vector3(0, 1.2, 3.5)
    let initialTarget = new THREE.Vector3(0, 0, 0)

    loader.load(
      glbUrl,
      (gltf) => {
        const root = gltf.scene

        // Visual enhancement: color spaces, max anisotropy, skinned mesh skeleton pose
        enhanceModelVisuals(root, renderer, 16)

        // Count triangles
        let triangles = 0
        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh
            mesh.castShadow = true
            mesh.receiveShadow = true
            if (mesh.geometry) {
              const geom = mesh.geometry
              if (geom.index) {
                triangles += geom.index.count / 3
              } else if (geom.attributes.position) {
                triangles += geom.attributes.position.count / 3
              }
            }
          }
        })
        setPolyCount(Math.round(triangles))

        // Create a wrapper to cleanly center and scale
        const wrapper = new THREE.Group()
        wrapper.add(root)

        // Standardized auto-fit: guarantees no container overflow, smooth centering & balanced scale
        const fit = autoFitModel(root, wrapper, {
          fov: 45,
          aspect: width / height,
          padding: 0.78,
          cameraDistance: 3.5,
          cameraPitch: 0.22,
          groundOffset: true,
        })

        // Adjust shadow plane height
        const scaledBox = new THREE.Box3().setFromObject(wrapper)
        shadowMesh.position.y = scaledBox.min.y - 0.01
        shadowMesh.scale.setScalar(Math.max(1, fit.boundingRadiusXZ * fit.scale * 2.2))

        // Position camera to view nicely from angle
        camera.position.copy(fit.cameraPosition)
        camera.lookAt(fit.cameraTarget)
        controls.target.copy(fit.cameraTarget)
        controls.update()

        initialCamPos.copy(camera.position)
        initialTarget.copy(controls.target)

        scene.add(wrapper)
        modelRef.current = wrapper
        setLoading(false)
      },
      (xhr) => {
        if (xhr.total > 0) {
          const pct = Math.round((xhr.loaded / xhr.total) * 100)
          setProgress(pct)
        } else if (xhr.loaded > 0) {
          setProgress(Math.min(95, Math.round(xhr.loaded / 50000)))
        }
      },
      (err) => {
        console.error('GLB model yuklashda xatolik:', err)
        setLoadError("3D modelni yuklab bo'lmadi")
        setLoading(false)
      }
    )

    resetCameraRef.current = () => {
      camera.position.copy(initialCamPos)
      controls.target.copy(initialTarget)
      controls.update()
    }

    // Animation loop
    let animId: number
    const animate = () => {
      animId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Handle container resize
    const handleResize = () => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight
      if (w > 0 && h > 0) {
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
      }
    }

    const ro = new ResizeObserver(handleResize)
    ro.observe(container)

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
      controls.dispose()
      try {
        envTexture.dispose()
        pmremGenerator.dispose()
      } catch (_) {}
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [glbUrl])

  return (
    <div className={`viewer-3d-root ${className}`} style={{ minHeight: '340px' }}>
      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        className="viewer-3d-canvas"
        style={{ width: '100%', height: '100%', minHeight: '340px' }}
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="viewer-3d-loading" style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(15, 7, 30, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 10,
          color: '#fff',
          gap: '12px'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            border: '3px solid rgba(168, 85, 247, 0.25)',
            borderTopColor: '#c084fc',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#e9d5ff' }}>
            3D GLB model yuklanmoqda... {progress > 0 ? `${progress}%` : ''}
          </div>
          {progress > 0 && (
            <div style={{
              width: '180px',
              height: '4px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #9333ea, #c084fc)',
                transition: 'width 0.2s ease'
              }} />
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {loadError && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(15, 7, 30, 0.85)',
          color: '#f87171',
          fontSize: '13px',
          fontWeight: 600,
          zIndex: 10
        }}>
          {loadError}
        </div>
      )}

      {/* Control Buttons Bar */}
      <div className="viewer-3d-controls">
        <button
          type="button"
          className={`viewer-btn ${autoRotate ? 'active' : ''}`}
          onClick={() => setAutoRotate((a) => !a)}
          title={autoRotate ? "Avto-aylantirishni to'xtatish" : "Avto-aylantirishni yoqish"}
        >
          <RotateCw size={14} />
          <span>{autoRotate ? '360° Aylanish' : '360° To‘xtatildi'}</span>
        </button>

        <button
          type="button"
          className={`viewer-btn ${wireframe ? 'active' : ''}`}
          onClick={() => setWireframe((w) => !w)}
          title={wireframe ? "Teksturali ko'rinish" : "Sim to'r (Wireframe)"}
        >
          <Box size={14} />
          <span>{wireframe ? 'Tekstura' : 'Sim to‘r'}</span>
        </button>

        <button
          type="button"
          className="viewer-btn"
          onClick={() => resetCameraRef.current()}
          title="Asl ko'rinishga qaytarish"
        >
          <RotateCcw size={14} />
          <span>Asl holat</span>
        </button>
      </div>
    </div>
  )
}

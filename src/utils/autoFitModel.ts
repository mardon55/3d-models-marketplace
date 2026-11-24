import * as THREE from 'three'

export interface AutoFitOptions {
  /** Target camera vertical FOV in degrees (default: 34) */
  fov?: number
  /** Viewport aspect ratio width / height (default: 1.5) */
  aspect?: number
  /** Safety padding factor between 0.65 and 0.90 (default: 0.82) */
  padding?: number
  /** Camera distance from target (default: 3.5) */
  cameraDistance?: number
  /** Camera pitch elevation angle in radians (default: 0.35 rad ~ 20 degrees) */
  cameraPitch?: number
  /** Camera yaw/azimuth angle in radians (default: 0.58 rad ~ 33 degrees for three-quarter 3D perspective) */
  cameraYaw?: number
}

export interface AutoFitResult {
  scale: number
  center: THREE.Vector3
  size: THREE.Vector3
  sphereRadius: number
  boundingRadiusXZ: number
  cameraPosition: THREE.Vector3
  cameraTarget: THREE.Vector3
}

/**
 * Intelligent AutoFitModel system:
 * Calculates precise bounding volume (box, XZ radius)
 * and scales/centers the model so it NEVER exceeds the viewport container
 * at ANY 360-degree rotation angle while presenting a rich, three-quarter 3D perspective.
 */
export function autoFitModel(
  root: THREE.Object3D,
  wrapper: THREE.Group,
  options: AutoFitOptions = {}
): AutoFitResult {
  const {
    fov = 34,
    aspect = 1.5,
    padding = 0.82,
    cameraDistance = 3.5,
    cameraPitch = 0.35, // ~20 degrees elevation for clear top/side visibility
    cameraYaw = 0.58,   // ~33 degrees azimuth for dynamic 3D three-quarter view
  } = options

  // 1. Force world matrix update across the hierarchy
  root.updateMatrixWorld(true)

  // 2. Compute tight bounding box
  const box = new THREE.Box3().setFromObject(root)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())

  // Handle degenerate or zero-size models safely
  if (size.x <= 0) size.x = 1
  if (size.y <= 0) size.y = 1
  if (size.z <= 0) size.z = 1

  // 3. Center model cleanly at (0, 0, 0) inside wrapper
  root.position.set(-center.x, -center.y, -center.z)
  wrapper.position.set(0, 0, 0)

  // 4. Compute rotation-invariant bounding radii
  // Horizontal radius in XZ plane: maximum extent at ANY Y-rotation angle
  const halfX = size.x * 0.5
  const halfZ = size.z * 0.5
  const boundingRadiusXZ = Math.sqrt(halfX * halfX + halfZ * halfZ)

  // Full 3D bounding sphere radius
  const halfY = size.y * 0.5
  const sphereRadius = Math.sqrt(halfX * halfX + halfY * halfY + halfZ * halfZ)

  // 5. Frustum visible dimensions at cameraDistance
  const halfFovRad = (fov * Math.PI) / 360
  const visibleHeight = 2.0 * cameraDistance * Math.tan(halfFovRad)
  const visibleWidth = visibleHeight * aspect

  // 6. Compute multi-axis scaling limits with safety padding
  // Limit A: Horizontal bounding circle fit (guarantees no left/right clipping during 360° rotation)
  const maxAllowedWidth = visibleWidth * padding
  const scaleHoriz = maxAllowedWidth / (2.0 * boundingRadiusXZ)

  // Limit B: Vertical height fit (accounting for camera pitch elevation)
  const maxAllowedHeight = visibleHeight * padding
  const projectedHeight = size.y * Math.cos(cameraPitch) + 2.0 * boundingRadiusXZ * Math.sin(cameraPitch)
  const scaleVert = maxAllowedHeight / Math.max(size.y, projectedHeight)

  // The final scale is the most constraining limit between horizontal and vertical
  const finalScale = Math.min(scaleHoriz, scaleVert)

  // Apply uniform scale to wrapper
  wrapper.scale.setScalar(finalScale)

  // 7. Compute standardized three-quarter camera position looking directly at center (0, 0, 0)
  const cosPitch = Math.cos(cameraPitch)
  const sinPitch = Math.sin(cameraPitch)
  const camX = cameraDistance * cosPitch * Math.sin(cameraYaw)
  const camY = cameraDistance * sinPitch
  const camZ = cameraDistance * cosPitch * Math.cos(cameraYaw)

  const cameraPosition = new THREE.Vector3(camX, camY, camZ)
  const cameraTarget = new THREE.Vector3(0, 0, 0)

  return {
    scale: finalScale,
    center,
    size,
    sphereRadius,
    boundingRadiusXZ,
    cameraPosition,
    cameraTarget,
  }
}

/**
 * Configure materials and textures for crystal-clear, razor-sharp rendering
 */
export function enhanceModelVisuals(
  root: THREE.Object3D,
  renderer: THREE.WebGLRenderer,
  maxAnisotropy: number = 8
): void {
  const anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy() || 1, maxAnisotropy)

  root.traverse((child) => {
    // 1. SkinnedMesh bone protection
    if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
      const sm = child as THREE.SkinnedMesh
      sm.frustumCulled = false
      if (sm.skeleton) {
        sm.skeleton.pose()
        sm.skeleton.update()
      }
    }

    // 2. Material & Texture Enhancements
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh
      mesh.frustumCulled = false

      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      materials.forEach((mat) => {
        if (!mat) return

        // Color maps must be in sRGB color space
        if ('map' in mat && mat.map) {
          mat.map.colorSpace = THREE.SRGBColorSpace
          mat.map.anisotropy = anisotropy
          mat.map.needsUpdate = true
        }

        // Emissive map sRGB
        if ('emissiveMap' in mat && mat.emissiveMap) {
          mat.emissiveMap.colorSpace = THREE.SRGBColorSpace
          mat.emissiveMap.anisotropy = anisotropy
          mat.emissiveMap.needsUpdate = true
        }

        // Normal / Roughness / Metalness maps linear
        if ('normalMap' in mat && mat.normalMap) {
          mat.normalMap.colorSpace = THREE.NoColorSpace
          mat.normalMap.anisotropy = anisotropy
        }
        if ('roughnessMap' in mat && mat.roughnessMap) {
          mat.roughnessMap.colorSpace = THREE.NoColorSpace
          mat.roughnessMap.anisotropy = anisotropy
        }
        if ('metalnessMap' in mat && mat.metalnessMap) {
          mat.metalnessMap.colorSpace = THREE.NoColorSpace
          mat.metalnessMap.anisotropy = anisotropy
        }

        // Standard material properties for crisp metallic and dielectric surfaces
        if (mat instanceof THREE.MeshStandardMaterial) {
          mat.envMapIntensity = 1.1
          mat.roughness = Math.min(1.0, Math.max(0.04, mat.roughness))
        }

        mat.needsUpdate = true
      })
    }
  })
}

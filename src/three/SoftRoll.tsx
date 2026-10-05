import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useTexture } from '@react-three/drei'
import { BufferGeometry, Color, DoubleSide, ExtrudeGeometry, Float32BufferAttribute, Object3D, RepeatWrapping, Shape, SRGBColorSpace } from 'three'
import type { InstancedMesh } from 'three'

export const SOFT_ROLL_HALF_HEIGHT = 0.8
export const SOFT_ROLL_HALF_WIDTH = 0.84
const TAU = Math.PI * 2
const noise = (n: number) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v) }

// A plump, slightly asymmetric cross-section. The underside remains flat on the plate.
function contour(a: number, seed: number, size = 1) {
  const c = Math.cos(a), s = Math.sin(a)
  const ripple = 1 + 0.018 * Math.sin(a * 5 + seed) + 0.009 * Math.sin(a * 11 + seed * 2)
  return [Math.sign(c) * Math.abs(c) ** 0.84 * 0.82 * ripple * size,
    Math.max(-0.8, Math.sign(s) * Math.abs(s) ** 0.84 * (s > 0 ? 0.87 : 0.81) * ripple) * size]
}

function surface(seed: number) {
  const vertices: number[] = [], uv: number[] = [], indices: number[] = []
  const segments = 128, rows = 40
  for (let j = 0; j <= rows; j++) {
    const t = j / rows, z = (t - 0.5) * 1.26
    const swell = 0.96 + 0.067 * Math.sin(t * Math.PI)
    for (let i = 0; i <= segments; i++) {
      const a = i / segments * TAU
      const [x, y] = contour(a, seed)
      const r = swell + 0.008 * Math.sin(a * 23 + z * 13) + 0.004 * Math.sin(a * 51 - z * 25)
      vertices.push(x * r, Math.max(-0.8, y * r), z + 0.014 * Math.sin(a * 7 + seed))
      uv.push(i / segments * 1.1 + seed * 0.11, t * 0.8)
      if (j < rows && i < segments) {
        const n = j * (segments + 1) + i
        indices.push(n, n + 1, n + segments + 1, n + 1, n + segments + 2, n + segments + 1)
      }
    }
  }
  // Rolled-over fish edges expose a soft lip instead of a hard extruded cut.
  for (const side of [-1, 1]) {
    const start = vertices.length / 3
    for (let j = 0; j <= 6; j++) {
      const t = j / 6
      for (let i = 0; i <= segments; i++) {
        const a = i / segments * TAU, [x, y] = contour(a, seed, 0.96 - t * 0.10)
        vertices.push(x, y, side * (0.63 + Math.sin(t * Math.PI) * 0.032) + 0.014 * Math.sin(a * 7 + seed))
        uv.push(i / segments * 1.1 + seed * 0.11, side > 0 ? 0.8 + t * 0.06 : -t * 0.06)
        if (j < 6 && i < segments) {
          const n = start + j * (segments + 1) + i
          indices.push(n, n + 1, n + segments + 1, n + 1, n + segments + 2, n + segments + 1)
        }
      }
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(vertices, 3))
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  g.setIndex(indices); g.computeVertexNormals()
  return g
}

function face(seed: number, outer: number, inner: number, side: number, z: number, relief = 0) {
  const vertices: number[] = [], indices: number[] = []
  const count = 96, rows = 16
  for (let j = 0; j <= rows; j++) {
    const t = j / rows, scale = inner + (outer - inner) * t
    for (let i = 0; i <= count; i++) {
      const a = i / count * TAU, [x, y] = contour(a, seed, scale)
      const n = Math.sin(x * 19 + Math.sin(y * 13) * 2) * Math.cos(y * 18 - x * 8)
      const bulge = relief * (0.6 + 0.4 * n) * (1 - t ** 4)
      vertices.push(x, y, side * (z + bulge))
      if (j < rows && i < count) {
        const k = j * (count + 1) + i
        indices.push(k, k + 1, k + count + 1, k + 1, k + count + 2, k + count + 1)
      }
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(vertices, 3)); g.setIndex(indices); g.computeVertexNormals()
  return g
}

function Rice({ seed }: { seed: number }) {
  const ref = useRef<InstancedMesh>(null)
  const count = 168
  useLayoutEffect(() => {
    if (!ref.current) return
    const dummy = new Object3D(), color = new Color()
    for (let i = 0; i < count; i++) {
      const side = i < count / 2 ? 1 : -1
      const n = i % (count / 2), row = n % 2, index = Math.floor(n / 2)
      const a = (index + row * 0.47 + noise(i + seed) * 0.32) / 42 * TAU
      const radius = 0.69 + row * 0.125 + (noise(i * 3 + seed) - 0.5) * 0.025
      const [x, y] = contour(a, seed, radius)
      dummy.position.set(x, y, side * (0.645 + noise(i * 7) * 0.017))
      dummy.rotation.set((noise(i * 9) - 0.5) * 0.8, (noise(i * 13) - 0.5) * 0.8, a + Math.PI / 2 + (noise(i * 17) - 0.5) * 1.1)
      dummy.scale.set(0.064 + noise(i * 2) * 0.022, 0.044 + noise(i * 5) * 0.012, 0.038 + noise(i * 8) * 0.012)
      dummy.updateMatrix(); ref.current.setMatrixAt(i, dummy.matrix)
      color.setHSL(0.095, 0.20 + noise(i) * 0.08, 0.79 + noise(i * 6) * 0.14)
      ref.current.setColorAt(i, color)
    }
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [seed])
  return <instancedMesh ref={ref} args={[undefined, undefined, count]} castShadow receiveShadow>
    <sphereGeometry args={[1, 12, 8]} />
    <meshPhysicalMaterial roughness={0.39} clearcoat={0.18} clearcoatRoughness={0.35} />
  </instancedMesh>
}

function Cucumber({ x, y, angle, side, variant }: { x: number; y: number; angle: number; side: number; variant: number }) {
  const geometry = useMemo(() => {
    const s = new Shape()
    s.moveTo(-0.15, -0.15); s.lineTo(0.13, -0.12); s.quadraticCurveTo(0.20, 0.02, 0.11, 0.17)
    s.lineTo(-0.14, 0.12); s.quadraticCurveTo(-0.18, 0, -0.15, -0.15)
    const g = new ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: true, bevelSize: 0.017, bevelThickness: 0.014, bevelSegments: 3, curveSegments: 8 })
    return g
  }, [])
  return <group position={[x, y, side * 0.637]} rotation={[side < 0 ? Math.PI : 0, 0, angle]}>
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshPhysicalMaterial attach="material-0" color={variant % 2 ? '#b9c875' : '#c4d383'} roughness={0.45} clearcoat={0.22} />
      <meshStandardMaterial attach="material-1" color="#38542a" roughness={0.65} />
    </mesh>
    {[0, 1, 2].map(i => <mesh key={i} position={[-0.04 + i * 0.055, 0.015, 0.099]} scale={[0.014, 0.033, 0.006]} rotation-z={0.2 + i * 0.4}>
      <sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color="#e0dfa8" roughness={0.5} />
    </mesh>)}
  </group>
}

export function SoftRoll({ seed = 1 }: { seed?: number }) {
  const source = useTexture(`${import.meta.env.BASE_URL}textures/salmon.webp`)
  const texture = useMemo(() => {
    const t = source.clone(); t.colorSpace = SRGBColorSpace; t.wrapS = t.wrapT = RepeatWrapping; t.anisotropy = 4; t.needsUpdate = true; return t
  }, [source])
  useEffect(() => () => texture.dispose(), [texture])
  const shapes = useMemo(() => ({ salmon: surface(seed), faces: [-1, 1].map(side => ({
    side, rice: face(seed, 0.89, 0.60, side, 0.625), nori: face(seed, 0.641, 0.60, side, 0.645, 0.015),
    cream: face(seed + 0.4, 0.612, 0, side, 0.651, 0.085),
  })) }), [seed])
  return <group>
    <mesh geometry={shapes.salmon} castShadow receiveShadow>
      <meshPhysicalMaterial map={texture} bumpMap={texture} bumpScale={0.009} color="#fff8eb" roughness={0.38} clearcoat={0.20} clearcoatRoughness={0.34} side={DoubleSide} />
    </mesh>
    {shapes.faces.map(f => <group key={f.side}>
      <mesh geometry={f.rice} receiveShadow><meshStandardMaterial color="#e8dbc4" roughness={0.65} side={DoubleSide} /></mesh>
      <mesh geometry={f.nori}><meshStandardMaterial color="#253124" roughness={0.73} side={DoubleSide} /></mesh>
      <mesh geometry={f.cream} receiveShadow><meshPhysicalMaterial color="#ffedc9" roughness={0.54} clearcoat={0.12} side={DoubleSide} /></mesh>
      <Cucumber x={0.10} y={0.25} angle={-0.22} side={f.side} variant={seed} />
      <Cucumber x={0.27} y={-0.05} angle={0.45} side={f.side} variant={seed + 1} />
      <Cucumber x={0.08} y={-0.28} angle={-0.48} side={f.side} variant={seed + 2} />
    </group>)}
    <Rice seed={seed} />
  </group>
}

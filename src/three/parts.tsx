import { useLayoutEffect, useMemo, useRef } from 'react'
import { CatmullRomCurve3, DoubleSide, ExtrudeGeometry, InstancedMesh, Object3D, Shape, SphereGeometry, Vector3 } from 'three'
import type { BufferGeometry, Material } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { materials, seededRandom } from './materials'

// Every roll piece is a unit-radius cylinder lying along z, resting on y = 0 when placed at y = 1
export const PIECE_LENGTH = 0.9
const HALF = PIECE_LENGTH / 2
const AXIS_Z: [number, number, number] = [Math.PI / 2, 0, 0]

const grainGeometry = new SphereGeometry(1, 10, 8)
const roeGeometry = new SphereGeometry(1, 14, 10)

type Placement = { position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] }

// Many small copies of one mesh in a single draw call
function Scatter({ placements, geometry, material }: { placements: Placement[]; geometry: BufferGeometry; material: Material }) {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const dummy = new Object3D()
    placements.forEach((p, i) => {
      dummy.position.set(...p.position)
      dummy.rotation.set(...p.rotation)
      dummy.scale.set(...p.scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [placements])
  return <instancedMesh ref={ref} args={[geometry, material, placements.length]} castShadow receiveShadow />
}

const grain = (rand: () => number, x: number, y: number, z: number, size = 1): Placement => ({
  position: [x, y, z],
  rotation: [rand() * Math.PI, rand() * Math.PI, rand() * Math.PI],
  scale: [0.095 * size * (0.8 + rand() * 0.4), 0.058 * size, 0.058 * size],
})

function lateralGrains(rand: () => number, count: number, radius = 1) {
  return Array.from({ length: count }, () => {
    const angle = rand() * Math.PI * 2
    return grain(rand, Math.cos(angle) * radius, Math.sin(angle) * radius, (rand() - 0.5) * PIECE_LENGTH * 0.94)
  })
}

function capGrains(rand: () => number, count: number, inner: number, outer: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = rand() * Math.PI * 2
    const r = Math.sqrt(inner * inner + rand() * (outer * outer - inner * inner))
    // A cut rice grain is nearly flush with the cut face, not a loose ball.
    return {
      position: [Math.cos(angle) * r, Math.sin(angle) * r, i % 2 ? HALF + 0.005 : -HALF - 0.005],
      rotation: [0, 0, rand() * Math.PI],
      scale: [0.068 * (0.8 + rand() * 0.4), 0.035, 0.025],
    } satisfies Placement
  })
}

function Ring({ inner, outer, material }: { inner: number; outer: number; material: Material }) {
  return (
    <>
      {[HALF + 0.003, -HALF - 0.003].map((z) => (
        <mesh key={z} position-z={z} rotation-y={z < 0 ? Math.PI : 0} material={material}>
          <ringGeometry args={[inner, outer, 56]} />
        </mesh>
      ))}
    </>
  )
}

export type Filling = 'salmon' | 'cucumber' | 'philadelphia' | 'california' | 'eel'

const segmentsFor: Record<Exclude<Filling, 'salmon' | 'cucumber'>, [Material, number][]> = {
  philadelphia: [[materials.cream, 2.3], [materials.salmon, 2.2], [materials.cucumber, 1.78]],
  california: [[materials.crab, 2.4], [materials.avocado, 2.1], [materials.cucumber, 1.78]],
  eel: [[materials.cream, 2.1], [materials.eel, 2.4], [materials.avocado, 1.78]],
}

function FillingCore({ filling, radius }: { filling: Filling; radius: number }) {
  const length = PIECE_LENGTH + 0.03
  if (filling === 'philadelphia') {
    return (
      <group>
        <mesh rotation={AXIS_Z} material={materials.cream} castShadow receiveShadow>
          <cylinderGeometry args={[radius, radius, length, 56]} />
        </mesh>
        {[[0.17, 0.23, -0.2], [0.25, -0.12, 0.12], [-0.07, -0.28, -0.35]].map(([x, y, rotation], i) => (
          <group key={i} position={[x, y, 0]} rotation-z={rotation}>
            <mesh material={materials.cucumber} castShadow>
              <boxGeometry args={[0.30, 0.32, length + 0.015]} />
            </mesh>
            <mesh material={materials.cucumberCore} position-x={-0.015}>
              <boxGeometry args={[0.25, 0.28, length + 0.022]} />
            </mesh>
            {[-1, 1].map((side) => (
              <mesh key={side} material={materials.cream} position={[0.012, 0.02, side * (length / 2 + 0.013)]} scale={[0.015, 0.045, 0.008]}>
                <sphereGeometry args={[1, 8, 6]} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    )
  }
  if (filling === 'salmon') {
    return (
      <mesh rotation={AXIS_Z} material={materials.salmon}>
        <cylinderGeometry args={[radius, radius, length, 40]} />
      </mesh>
    )
  }
  if (filling === 'cucumber') {
    return (
      <>
        <mesh rotation={AXIS_Z} material={materials.cucumber}>
          <cylinderGeometry args={[radius, radius, length, 40]} />
        </mesh>
        <mesh rotation={AXIS_Z} material={materials.cucumberCore}>
          <cylinderGeometry args={[radius * 0.55, radius * 0.55, length + 0.01, 32]} />
        </mesh>
      </>
    )
  }
  const segments = segmentsFor[filling]
  return (
    <>
      {segments.map(([material, size], i) => {
        const thetaStart = segments.slice(0, i).reduce((sum, [, s]) => sum + s, 0)
        return (
          <mesh key={thetaStart} rotation={AXIS_Z} material={material}>
            <cylinderGeometry args={[radius, radius, length, 16, 1, false, thetaStart, size]} />
          </mesh>
        )
      })}
    </>
  )
}

// Maki: nori outside, rice inside. Uramaki: rice outside, nori ring around the filling.
export function RollPiece({ style, filling, seed = 1 }: { style: 'maki' | 'uramaki'; filling: Filling; seed?: number }) {
  const grains = useMemo(() => {
    const rand = seededRandom(seed)
    return style === 'uramaki'
      ? [...lateralGrains(rand, 620), ...capGrains(rand, 850, filling === 'philadelphia' ? 0.62 : 0.5, 0.97)]
      : capGrains(rand, 620, 0.42, 0.93)
  }, [style, filling, seed])

  return (
    <group>
      {style === 'maki' ? (
        <>
          <mesh rotation={AXIS_Z} material={materials.nori}>
            <cylinderGeometry args={[1, 1, PIECE_LENGTH, 56, 1, true]} />
          </mesh>
          <mesh rotation={AXIS_Z} material={materials.rice}>
            <cylinderGeometry args={[0.965, 0.965, PIECE_LENGTH - 0.004, 56]} />
          </mesh>
          <Ring inner={0.955} outer={1.0} material={materials.nori} />
          <FillingCore filling={filling} radius={0.37} />
        </>
      ) : (
        <>
          <mesh rotation={AXIS_Z} material={materials.rice} castShadow receiveShadow>
            <cylinderGeometry args={[1, 1, PIECE_LENGTH, 56]} />
          </mesh>
          <Ring inner={filling === 'philadelphia' ? 0.575 : 0.37} outer={filling === 'philadelphia' ? 0.61 : 0.47} material={materials.nori} />
          <FillingCore filling={filling} radius={filling === 'philadelphia' ? 0.58 : 0.375} />
        </>
      )}
      <Scatter placements={grains} geometry={grainGeometry} material={materials.rice} />
    </group>
  )
}

// A thick layer draped over the top of a roll piece: a slice of fish or a baked sauce cap.
// `overhang` is how far past the horizontal the layer hangs down on each side, in radians.
export function Drape({
  material = materials.salmon,
  outer = 1.075,
  inner = 0.985,
  overhang = 0.75,
  textureOffset = 0,
  textureRepeat = 1,
}: {
  material?: Material
  outer?: number
  inner?: number
  overhang?: number
  textureOffset?: number
  textureRepeat?: number
}) {
  const geometry = useMemo(() => {
    const shape = new Shape()
    shape.absarc(0, 0, outer, -overhang, Math.PI + overhang, false)
    shape.absarc(0, 0, inner, Math.PI + overhang, -overhang, true)
    const depth = PIECE_LENGTH - 0.04
    const g = new ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.018,
      bevelSegments: 4,
      curveSegments: 48,
    })
    g.translate(0, 0, -depth / 2)
    const vertices = g.attributes.position
    const uv = g.attributes.uv
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i)
      const ripple = 1 + 0.007 * Math.sin(x * 13 + z * 7) * Math.sin(y * 9 - z * 11)
      vertices.setXYZ(i, x * ripple, y * ripple, z)
      let angle = Math.atan2(y, x)
      if (angle < -overhang - 0.1) angle += Math.PI * 2
      uv.setXY(i, (z / depth + 0.5) * textureRepeat + textureOffset, (angle + overhang) / (Math.PI + overhang * 2))
    }
    g.computeVertexNormals()
    return g
  }, [outer, inner, overhang, textureOffset, textureRepeat])
  return <mesh geometry={geometry} material={material} castShadow receiveShadow />
}

export function TobikoCoat({ seed = 7 }: { seed?: number }) {
  const placements = useMemo(() => {
    const rand = seededRandom(seed)
    return Array.from({ length: 460 }, (): Placement => {
      const angle = rand() * Math.PI * 2
      const s = 0.045 + rand() * 0.012
      return {
        position: [Math.cos(angle) * 1.02, Math.sin(angle) * 1.02, (rand() - 0.5) * PIECE_LENGTH * 0.96],
        rotation: [0, 0, 0],
        scale: [s, s, s],
      }
    })
  }, [seed])
  return <Scatter placements={placements} geometry={roeGeometry} material={materials.tobiko} />
}

function Drizzle({ points, radius = 0.035 }: { points: [number, number, number][]; radius?: number }) {
  const curve = useMemo(() => new CatmullRomCurve3(points.map((p) => new Vector3(...p))), [points])
  return (
    <mesh material={materials.unagi}>
      <tubeGeometry args={[curve, 80, radius, 8, false]} />
    </mesh>
  )
}

const eelDrizzle: [number, number, number][] = [
  [-0.55, 1.12, -0.4],
  [0.45, 1.16, -0.24],
  [-0.45, 1.18, -0.04],
  [0.5, 1.16, 0.16],
  [-0.4, 1.12, 0.36],
]

export function EelGlaze({ seed = 11 }: { seed?: number }) {
  const sesame = useMemo(() => {
    const rand = seededRandom(seed)
    return Array.from({ length: 36 }, (): Placement => {
      const angle = 0.35 + rand() * (Math.PI - 0.7)
      return {
        position: [Math.cos(angle) * 1.17, Math.sin(angle) * 1.17, (rand() - 0.5) * PIECE_LENGTH * 0.8],
        rotation: [rand() * 3, rand() * 3, rand() * 3],
        scale: [0.05, 0.025, 0.03],
      }
    })
  }, [seed])
  return (
    <>
      <Drape material={materials.eel} />
      <Drizzle points={eelDrizzle} />
      <Scatter placements={sesame} geometry={grainGeometry} material={materials.sesame} />
    </>
  )
}

// Zigzag of unagi sauce across a cap of the given radius
const capDrizzle = (radius: number): [number, number, number][] =>
  [-0.75, -0.4, 0, 0.4, 0.75].map((x, i) => [x, Math.sqrt(radius * radius - x * x) + 0.02, i % 2 ? 0.3 : -0.3])

// Torched sauce cap hugging the top of a maki piece
export function BakedCap({ seed = 5 }: { seed?: number }) {
  const scallion = useMemo(() => {
    const rand = seededRandom(seed)
    return Array.from({ length: 12 }, (): Placement => {
      const angle = 0.5 + rand() * (Math.PI - 1)
      return {
        position: [Math.cos(angle) * 1.27, Math.sin(angle) * 1.27, (rand() - 0.5) * 0.6],
        rotation: [0, rand() * Math.PI, 0],
        scale: [0.06, 0.03, 0.06],
      }
    })
  }, [seed])
  const drizzle = useMemo(() => capDrizzle(1.27), [])
  return (
    <>
      <Drape material={materials.sauce} outer={1.26} inner={0.97} overhang={-0.3} />
      <Drizzle points={drizzle} radius={0.04} />
      <Scatter placements={scallion} geometry={grainGeometry} material={materials.scallion} />
    </>
  )
}

// Rice block with a bent slice of fish on top; rests on y = 0
export function Nigiri({ fish = materials.salmonSlice, seed = 3 }: { fish?: Material; seed?: number }) {
  const slab = useMemo(() => {
    // A flattened sphere has enough vertices across its top to bend smoothly over the rice
    const g = new SphereGeometry(1, 64, 24)
    g.scale(1.1, 0.17, 0.57)
    const position = g.attributes.position
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i)
      position.setY(i, position.getY(i) - 0.3 * x * x)
    }
    g.computeVertexNormals()
    return g
  }, [])
  const grains = useMemo(() => {
    const rand = seededRandom(seed)
    return Array.from({ length: 220 }, () => {
      const u = (rand() - 0.5) * 1.88
      const cap = Math.abs(u) > 0.475 ? Math.sqrt(Math.max(0, 1 - ((Math.abs(u) - 0.475) / 0.46) ** 2)) : 1
      // Only the sides: the top of the rice is hidden under the fish
      const angle = rand() < 0.5 ? -0.5 + rand() * 1.05 : Math.PI - 0.55 + rand() * 1.05
      return grain(rand, u, 0.44 + Math.sin(angle) * 0.44 * cap, Math.cos(angle) * 0.54 * cap)
    })
  }, [seed])
  return (
    <group>
      <mesh material={materials.rice} position-y={0.44} rotation-z={Math.PI / 2} scale={[0.95, 1, 1.18]}>
        <capsuleGeometry args={[0.46, 0.95, 8, 24]} />
      </mesh>
      <Scatter placements={grains} geometry={grainGeometry} material={materials.rice} />
      <mesh geometry={slab} material={fish} position-y={0.95} />
    </group>
  )
}

export function Gunkan({ seed = 9 }: { seed?: number }) {
  const roe = useMemo(() => {
    const rand = seededRandom(seed)
    return Array.from({ length: 52 }, (): Placement => {
      const angle = rand() * Math.PI * 2
      const r = Math.sqrt(rand())
      const x = Math.cos(angle) * r * 0.66
      const z = Math.sin(angle) * r * 0.48
      const s = 0.1 + rand() * 0.025
      return { position: [x, 0.62 + (1 - r * r) * 0.2 + rand() * 0.05, z], rotation: [0, 0, 0], scale: [s, s, s] }
    })
  }, [seed])
  return (
    <group>
      <mesh material={materials.nori} position-y={0.36} scale={[1.3, 1, 1]}>
        <cylinderGeometry args={[0.6, 0.6, 0.72, 48, 1, true]} />
      </mesh>
      <mesh material={materials.rice} position-y={0.27} scale={[1.3, 1, 1]}>
        <cylinderGeometry args={[0.585, 0.585, 0.54, 40]} />
      </mesh>
      <Scatter placements={roe} geometry={roeGeometry} material={materials.roe} />
    </group>
  )
}

// Wooden board; its top surface is at y = 0
export function Board({ width, depth, height = 0.36, material = materials.wood }: { width: number; depth: number; height?: number; material?: Material }) {
  const geometry = useMemo(() => new RoundedBoxGeometry(width, height, depth, 5, 0.14), [width, depth, height])
  return <mesh geometry={geometry} material={material} position-y={-height / 2} castShadow receiveShadow />
}

// Chef's knife: blade along +x in the XY plane, cutting edge facing -y, handle along -x
export function Knife() {
  const blade = useMemo(() => {
    const shape = new Shape()
    shape.moveTo(0, 0.14)
    shape.lineTo(1.85, 0.14)
    shape.quadraticCurveTo(2.35, 0.12, 2.65, -0.16)
    shape.quadraticCurveTo(2.15, -0.33, 1.6, -0.36)
    shape.lineTo(0, -0.3)
    shape.lineTo(0, 0.14)
    const g = new ExtrudeGeometry(shape, {
      depth: 0.03,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 2,
    })
    g.translate(0, 0, -0.015)
    return g
  }, [])
  const edge = useMemo(() => {
    const shape = new Shape()
    shape.moveTo(0, -0.3)
    shape.lineTo(1.6, -0.36)
    shape.quadraticCurveTo(2.15, -0.33, 2.65, -0.16)
    shape.quadraticCurveTo(2.15, -0.26, 1.6, -0.29)
    shape.lineTo(0, -0.23)
    shape.closePath()
    return shape
  }, [])
  return (
    <group>
      <mesh geometry={blade} material={materials.blade} castShadow />
      {[-0.029, 0.029].map((z) => (
        <mesh key={z} position-z={z}>
          <shapeGeometry args={[edge]} />
          <meshPhysicalMaterial color="#f2f4f1" metalness={0.4} roughness={0.18} side={DoubleSide} />
        </mesh>
      ))}
      <mesh material={materials.steel} position={[-0.06, -0.1, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.15, 0.15, 0.12, 24]} />
      </mesh>
      <mesh material={materials.handle} position={[-0.62, -0.1, 0]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.135, 0.16, 1.05, 8]} />
      </mesh>
    </group>
  )
}

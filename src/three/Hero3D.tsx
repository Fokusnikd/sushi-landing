import { ContactShadows, Environment, Lightformer, useGLTF } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useInView, useReducedMotion } from 'motion/react'
import { useLayoutEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { Box3, PCFShadowMap, SRGBColorSpace, Vector3 } from 'three'
import type { Group, Mesh, MeshStandardMaterial } from 'three'

// "Sushi" by 3DSCANPRO, CC BY 4.0: https://sketchfab.com/3d-models/sushi-e0e1fa90a0614fb099f2e607372efb6f
export const MODEL_URL = `${import.meta.env.BASE_URL}models/sushi.glb`
// Longest side of the board in scene units; the old plate was ~5.9 across.
const BOARD_LENGTH = 6.2
// Diagonal placement lets a wide board fill a square frame.
const BOARD_YAW = -0.42
const SWAY_PERIOD = 14

function SushiBoard() {
  const { scene } = useGLTF(MODEL_URL)
  const model = useMemo(() => scene.clone(true), [scene])

  // Center on X/Z, rest on y = 0, scale to a fixed length so the camera framing does not depend on the source units.
  useLayoutEffect(() => {
    model.position.set(0, 0, 0)
    model.scale.setScalar(1)
    model.updateMatrixWorld(true)
    const box = new Box3().setFromObject(model)
    const size = box.getSize(new Vector3())
    const center = box.getCenter(new Vector3())
    const k = BOARD_LENGTH / Math.max(size.x, size.z)
    model.scale.setScalar(k)
    model.position.set(-center.x * k, -box.min.y * k, -center.z * k)
    model.traverse((node) => {
      const mesh = node as Mesh
      if (!mesh.isMesh) return
      mesh.castShadow = true
      mesh.receiveShadow = true
      const material = mesh.material as MeshStandardMaterial
      if (material.map) material.map.colorSpace = SRGBColorSpace
      // Scans carry baked lighting; keep them matte so the studio lights do not add a plastic sheen.
      material.roughness = Math.max(material.roughness ?? 1, 0.75)
      material.metalness = 0
    })
  }, [model])

  return <primitive object={model} />
}

function Composition({ animate, active, pointer }: { animate: boolean; active: boolean; pointer: RefObject<[number, number]> }) {
  const rig = useRef<Group>(null)
  const elapsed = useRef(0)

  useFrame((_, delta) => {
    if (animate && active) elapsed.current += Math.min(delta, 0.05)
    if (!rig.current) return
    const t = elapsed.current
    const sway = animate ? 0.16 * Math.sin((t / SWAY_PERIOD) * Math.PI * 2) : 0
    const blend = 1 - Math.exp(-delta * 4)
    rig.current.rotation.y += (BOARD_YAW + sway + (animate ? pointer.current[0] * 0.12 : 0) - rig.current.rotation.y) * blend
    rig.current.rotation.x += ((animate ? pointer.current[1] * 0.035 : 0) - rig.current.rotation.x) * blend
    rig.current.position.y = -0.35 + (animate ? 0.04 * Math.sin(t * 1.1) : 0)
  })

  return (
    <group ref={rig} position-y={-0.35} rotation-y={BOARD_YAW}>
      <SushiBoard />
    </group>
  )
}

export default function Hero3D() {
  const frame = useRef<HTMLDivElement>(null)
  const pointer = useRef<[number, number]>([0, 0])
  const inView = useInView(frame, { amount: 0.15 })
  const reduce = useReducedMotion()
  return (
    <div ref={frame} className="absolute inset-0" role="img"
      aria-label="Бамбуковая доска с роллами, имбирём, васаби и палочками"
      onPointerMove={(event) => {
        if (reduce || event.pointerType === 'touch') return
        const box = event.currentTarget.getBoundingClientRect()
        pointer.current = [(event.clientX - box.left) / box.width * 2 - 1, (event.clientY - box.top) / box.height * 2 - 1]
      }}
      onPointerLeave={() => { pointer.current = [0, 0] }}>
      <Canvas shadows={{ type: PCFShadowMap }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 6.2, 9.4], fov: 30 }} frameloop={!reduce && inView ? 'always' : 'demand'}
        onCreated={({ camera }) => camera.lookAt(0, 0.1, 0)}>
        <hemisphereLight args={['#fff4df', '#a08b73', 0.7]} />
        <directionalLight position={[-3, 6, 5]} intensity={2.2} color="#fff3e2" castShadow
          shadow-mapSize={[2048, 2048]} shadow-camera-left={-4} shadow-camera-right={4}
          shadow-camera-top={4} shadow-camera-bottom={-4} shadow-normalBias={0.02} shadow-bias={-0.0001} />
        <directionalLight position={[4, 3, -3]} intensity={0.5} color="#fff6e8" />
        <Environment resolution={128} environmentIntensity={0.55}>
          <Lightformer intensity={3} position={[-3, 5, 3]} rotation-x={Math.PI / 3} scale={[5, 5, 1]} />
          <Lightformer intensity={1.5} position={[4, 3, 1]} rotation-y={-Math.PI / 2} scale={[3, 4, 1]} />
        </Environment>
        <Composition animate={!reduce} active={inView} pointer={pointer} />
        <ContactShadows position-y={-0.37} scale={10} blur={2.4} far={3} opacity={0.32} color="#76614f" />
      </Canvas>
    </div>
  )
}

useGLTF.preload(MODEL_URL)

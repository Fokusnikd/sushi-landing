import { ContactShadows, Environment, Lightformer } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useInView, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { CanvasTexture, DoubleSide, LatheGeometry, PCFShadowMap, PlaneGeometry, SRGBColorSpace, Vector2, Vector3 } from 'three'
import type { Group, Mesh } from 'three'
import { SoftRoll, SOFT_ROLL_HALF_HEIGHT } from './SoftRoll'

const REST_Y = 0.115 + SOFT_ROLL_HALF_HEIGHT
const FRONT_Z = 0.95
const PERIOD = 11
const clamp = (n: number) => Math.max(0, Math.min(1, n))
const smooth = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t) }

// Close, lift, pause, set down, release. No roll movement before the grip closes.
function platePose(time: number) {
  const t = time % PERIOD
  const approach = smooth((t - 1.5) / 1.2)
  const retreat = smooth((t - 8.2) / 1.3)
  const grip = smooth((t - 2.7) / 0.6) * (1 - smooth((t - 7.6) / 0.6))
  const lift = 0.85 * smooth((t - 3.4) / 1.4) * (1 - smooth((t - 6) / 1.5))
  return { lift, gap: 0.72 + 0.22 * (1 - grip), hover: 0.65 * (1 - approach + retreat) }
}

function Plate() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#f1e3cf'; ctx.fillRect(0, 0, 512, 512)
    for (let i = 0; i < 9000; i++) {
      const random = (n: number) => { const v = Math.sin(n * 127.1) * 43758.5453; return v - Math.floor(v) }
      ctx.fillStyle = i % 5 ? 'rgba(135,105,67,0.10)' : 'rgba(112,80,43,0.24)'
      ctx.beginPath(); ctx.arc(random(i + 1) * 512, random(i + 9001) * 512, 0.2 + random(i + 18001) * 0.65, 0, Math.PI * 2); ctx.fill()
    }
    const t = new CanvasTexture(canvas); t.colorSpace = SRGBColorSpace; return t
  }, [])
  useEffect(() => () => texture.dispose(), [texture])
  const geometry = useMemo(() => {
    const profile = [[0, 0.11], [1.9, 0.11], [2.08, 0.13], [2.28, 0.2], [2.55, 0.31],
      [2.78, 0.36], [2.89, 0.355], [2.93, 0.32], [2.9, 0.275], [2.68, 0.23],
      [2.25, 0.075], [1.94, -0.025], [1.7, -0.07], [0, -0.07]]
    return new LatheGeometry(profile.map(([x, y]) => new Vector2(x, y)), 128)
  }, [])
  return (
    <group>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial map={texture} bumpMap={texture} bumpScale={0.009} roughness={0.62} clearcoat={0.10} clearcoatRoughness={0.6} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position-y={0.367}>
        <torusGeometry args={[2.84, 0.015, 8, 128]} />
        <meshStandardMaterial color="#c7b393" roughness={0.8} />
      </mesh>
    </group>
  )
}

function Garnishes() {
  const petal = useMemo(() => {
    const g = new PlaneGeometry(0.76, 0.60, 28, 24)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) / 0.76, v = p.getY(i) / 0.60
      p.setXYZ(i, u * 0.76 * (0.66 + 0.34 * Math.cos(v * Math.PI)),
        0.17 * Math.cos(u * 6) + 0.11 * Math.sin(v * 7 + u * 4) + 0.045 * Math.sin(u * 15), v * 0.60)
    }
    g.computeVertexNormals()
    return g
  }, [])
  const wasabi = useMemo(() => {
    const g = new LatheGeometry([[0, 0], [0.23, 0.015], [0.28, 0.08], [0.24, 0.2], [0.16, 0.37], [0.045, 0.52], [0, 0.56]]
      .map(([r, y]) => new Vector2(r, y)), 80)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), y = p.getY(i)
      const r = 1 + 0.23 * Math.sin(Math.atan2(z, x) * 9 + y * 7) + 0.035 * Math.sin(y * 110 + Math.atan2(z, x) * 37)
      p.setXYZ(i, x * r + y * y * 0.3, y, z * r)
    }
    g.computeVertexNormals()
    return g
  }, [])
  return (
    <group>
      <group position={[-1.78, 0.22, 0.94]} rotation-y={0.4}>
        {Array.from({ length: 9 }, (_, i) => (
          <mesh key={i} geometry={petal} position={[Math.cos(i * 2.4) * 0.19, i * 0.046, Math.sin(i * 2.4) * 0.14]}
            rotation={[i * 0.09, i * 2.4, 0.15]} castShadow receiveShadow>
            <meshPhysicalMaterial color={i % 2 ? '#ef8f78' : '#f6aa91'} roughness={0.39} clearcoat={0.22} side={DoubleSide} />
          </mesh>
        ))}
      </group>
      {[0, 1, 2].map(i => <mesh key={i} geometry={wasabi} position={[1.73 + Math.cos(i * 2.1) * 0.12, 0.14, 1.08 + Math.sin(i * 2.1) * 0.12]} scale={i === 0 ? 1 : 0.76} rotation-y={i * 1.3} castShadow receiveShadow>
        <meshStandardMaterial color="#78942d" roughness={0.88} />
      </mesh>)}
    </group>
  )
}

function Composition({ animate, active, pointer }: { animate: boolean; active: boolean; pointer: RefObject<[number, number]> }) {
  const rig = useRef<Group>(null)
  const movingRoll = useRef<Group>(null)
  const sticks = useRef<(Mesh | null)[]>([])
  const elapsed = useRef(0)
  const vectors = useMemo(() => ({ tip: new Vector3(), end: new Vector3(), direction: new Vector3(), up: new Vector3(0, 1, 0) }), [])

  useFrame((_, delta) => {
    if (animate && active) elapsed.current += Math.min(delta, 0.05)
    const pose = platePose(animate ? elapsed.current : 0)
    if (movingRoll.current) movingRoll.current.position.y = REST_Y + pose.lift
    sticks.current.forEach((stick, i) => {
      if (!stick) return
      const side = i === 0 ? -1 : 1
      const { tip, end, direction, up } = vectors
      // Grip the two cut faces. Both shafts extend to the right, outside the food.
      tip.set(0.50, REST_Y + 0.26 + pose.lift + pose.hover, FRONT_Z + side * pose.gap)
      end.set(2.70, 2.65 + pose.lift + pose.hover, FRONT_Z + side * 0.98)
      direction.subVectors(end, tip)
      stick.position.copy(tip).add(end).multiplyScalar(0.5)
      stick.scale.y = direction.length()
      stick.quaternion.setFromUnitVectors(up, direction.normalize())
    })
    if (rig.current) {
      const blend = 1 - Math.exp(-delta * 4)
      rig.current.rotation.y += ((animate ? pointer.current[0] * 0.12 : 0) - rig.current.rotation.y) * blend
      rig.current.rotation.x += ((animate ? pointer.current[1] * 0.035 : 0) - rig.current.rotation.x) * blend
    }
  })

  return (
    <group ref={rig} position-y={-0.35}>
      <Plate />
      <group position={[-0.99, REST_Y, -0.76]} rotation-y={0.12}><SoftRoll seed={2} /></group>
      <group position={[0.99, REST_Y, -0.76]} rotation-y={-0.13}><SoftRoll seed={4} /></group>
      <group ref={movingRoll} position={[0, REST_Y, FRONT_Z]}><SoftRoll seed={6} /></group>
      <Garnishes />
      {[0, 1].map((i) => (
        <mesh key={i} ref={(el) => { sticks.current[i] = el }} castShadow>
          <cylinderGeometry args={[0.061, 0.025, 1, 12]} />
          <meshPhysicalMaterial color="#493025" roughness={0.42} clearcoat={0.2} />
        </mesh>
      ))}
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
      aria-label="Три ролла на керамической тарелке с имбирём и васаби; палочки плавно поднимают один ролл"
      onPointerMove={(event) => {
        if (reduce || event.pointerType === 'touch') return
        const box = event.currentTarget.getBoundingClientRect()
        pointer.current = [(event.clientX - box.left) / box.width * 2 - 1, (event.clientY - box.top) / box.height * 2 - 1]
      }}
      onPointerLeave={() => { pointer.current = [0, 0] }}>
      <Canvas shadows={{ type: PCFShadowMap }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}
        camera={{ position: [2.25, 4.7, 10.0], fov: 29 }} frameloop={!reduce && inView ? 'always' : 'demand'}
        onCreated={({ camera }) => camera.lookAt(0, 0.50, 0)}>
        <hemisphereLight args={['#fff4df', '#a08b73', 0.75]} />
        <directionalLight position={[-3, 6, 5]} intensity={2.7} color="#fff3e2" castShadow
          shadow-mapSize={[2048, 2048]} shadow-camera-left={-4} shadow-camera-right={4}
          shadow-camera-top={5} shadow-camera-bottom={-4} shadow-normalBias={0.018} shadow-bias={-0.0001} />
        <directionalLight position={[4, 3, -3]} intensity={0.65} color="#fff6e8" />
        <directionalLight position={[1, 4, 8]} intensity={0.7} color="#fffaf1" />
        <Environment resolution={128} environmentIntensity={0.65}>
          <Lightformer intensity={3} position={[-3, 5, 3]} rotation-x={Math.PI / 3} scale={[5, 5, 1]} />
          <Lightformer intensity={1.5} position={[4, 3, 1]} rotation-y={-Math.PI / 2} scale={[3, 4, 1]} />
        </Environment>
        <Composition animate={!reduce} active={inView} pointer={pointer} />
        <ContactShadows position-y={-0.43} scale={10} blur={2.6} far={4} opacity={0.32} color="#76614f" />
      </Canvas>
    </div>
  )
}

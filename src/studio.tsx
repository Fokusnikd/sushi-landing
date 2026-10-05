import { ContactShadows } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { createRoot } from 'react-dom/client'
import type { SushiKind } from './components/Sushi'
import { Lights, SushiModel } from './three/SushiModel'

// Dev-only renderer for menu pictures.
// /studio.html?kind=philadelphia — one dish, screenshot it into public/sushi/<kind>.webp
// /studio.html?kind=sheet — every dish in a grid, to review them at a glance
const allKinds: SushiKind[] = [
  'philadelphia',
  'california',
  'andryusha',
  'maki-salmon',
  'maki-cucumber',
  'baked-salmon',
  'baked-crab',
  'baked-eel',
  'nigiri-salmon',
  'nigiri-tuna',
  'gunkan',
  'set-small',
  'set-big',
]

export function Dish({ kind, dpr }: { kind: SushiKind; dpr: number }) {
  const isSet = kind.startsWith('set')
  const isLow = kind.startsWith('nigiri') || kind === 'gunkan'
  const position: [number, number, number] = isSet ? [3.3, 3.3, 5.1] : isLow ? [2.6, 1.9, 4] : [3.2, 2.9, 4.6]
  const target: [number, number, number] = isSet ? [0, 0.3, 0] : isLow ? [0, 0.62, 0] : [0, 1.15, 0]

  return (
    <Canvas
      flat
      dpr={dpr}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      camera={{ position, fov: isSet ? 34 : 36 }}
      onCreated={({ camera }) => camera.lookAt(...target)}
    >
      <color attach="background" args={['#f3ece1']} />
      <Lights />
      <group rotation-y={isSet ? -0.2 : isLow ? -0.5 : -0.15}>
        <SushiModel kind={kind} />
      </group>
      <ContactShadows position-y={0.002} scale={8} blur={2.2} far={3} opacity={0.35} color="#7a5a3a" />
    </Canvas>
  )
}

const param = new URLSearchParams(window.location.search).get('kind') ?? 'philadelphia'

createRoot(document.getElementById('root')!).render(
  param === 'sheet' ? (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 200px)', gap: 8, padding: 8 }}>
      {allKinds.map((kind) => (
        <figure key={kind} style={{ margin: 0, width: 200, height: 222, font: '12px sans-serif', textAlign: 'center' }}>
          <div style={{ width: 200, height: 200 }}>
            <Dish kind={kind} dpr={1} />
          </div>
          {kind}
        </figure>
      ))}
    </div>
  ) : (
    <Dish kind={param as SushiKind} dpr={2} />
  ),
)

import { Environment, Lightformer } from '@react-three/drei'
import type { ReactNode } from 'react'
import type { SushiKind } from '../components/Sushi'
import { materials } from './materials'
import { BakedCap, Board, Drape, EelGlaze, Gunkan, Nigiri, RollPiece, TobikoCoat } from './parts'

// Soft studio light plus an environment made of light panels, so glossy fish and steel get reflections
export function Lights() {
  return (
    <>
      <hemisphereLight args={['#fff8ef', '#71604f', 0.8]} />
      <directionalLight position={[-3, 7, 5]} intensity={2.5} color="#fff4e8" castShadow
        shadow-mapSize={[1024, 1024]} shadow-camera-left={-5} shadow-camera-right={5}
        shadow-camera-top={5} shadow-camera-bottom={-5} shadow-normalBias={0.035} shadow-bias={-0.0001} />
      <directionalLight position={[4, 3, -3]} intensity={1.2} color="#eaf2ff" />
      <directionalLight position={[7, 3, 6]} intensity={0.9} color="#fffaf1" />
      <Environment resolution={128}>
        <Lightformer intensity={3} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[7, 4, 1]} />
        <Lightformer intensity={2} position={[-4, 2, 3]} rotation-y={Math.PI / 4} scale={[3, 5, 1]} color="#fff0dc" />
        <Lightformer intensity={3} position={[4, 2, -3]} rotation-y={-Math.PI / 2} scale={[2, 5, 1]} />
        <Lightformer intensity={2} position={[6, 3, 7]} scale={[5, 5, 1]} />
      </Environment>
    </>
  )
}

// Places a roll piece so it rests on y = 0
function Piece({ children, x = 0, z = 0, rotation = 0, scale = 1 }: { children: ReactNode; x?: number; z?: number; rotation?: number; scale?: number }) {
  return (
    <group position={[x, scale, z]} rotation-y={rotation} scale={scale}>
      {children}
    </group>
  )
}

const philadelphia = (
  <>
    <RollPiece style="uramaki" filling="philadelphia" />
    <Drape />
  </>
)

const california = (
  <>
    <RollPiece style="uramaki" filling="california" seed={2} />
    <TobikoCoat />
  </>
)

const makiSalmon = <RollPiece style="maki" filling="salmon" seed={4} />

export function SushiModel({ kind }: { kind: SushiKind }) {
  switch (kind) {
    case 'philadelphia':
      return <Piece>{philadelphia}</Piece>
    case 'california':
      return <Piece>{california}</Piece>
    case 'andryusha':
      return (
        <Piece>
          <RollPiece style="uramaki" filling="eel" seed={6} />
          <EelGlaze />
        </Piece>
      )
    case 'maki-salmon':
      return <Piece>{makiSalmon}</Piece>
    case 'maki-cucumber':
      return (
        <Piece>
          <RollPiece style="maki" filling="cucumber" seed={8} />
        </Piece>
      )
    case 'baked-salmon':
    case 'baked-crab':
    case 'baked-eel':
      return (
        <Piece>
          <RollPiece style="maki" filling={kind === 'baked-salmon' ? 'salmon' : kind === 'baked-crab' ? 'california' : 'eel'} seed={10} />
          <BakedCap />
        </Piece>
      )
    case 'nigiri-salmon':
      return <Nigiri />
    case 'nigiri-tuna':
      return <Nigiri fish={materials.tunaSlice} seed={12} />
    case 'gunkan':
      return <Gunkan />
    case 'set-small':
      return (
        <group>
          <Board width={3.8} depth={2.1} height={0.26} />
          <Piece x={-1.15} z={0.15} scale={0.52} rotation={-0.35}>
            {philadelphia}
          </Piece>
          <Piece x={0.05} z={-0.2} scale={0.5} rotation={-0.35}>
            {makiSalmon}
          </Piece>
          <Piece x={1.2} z={0.2} scale={0.5} rotation={-0.35}>
            {california}
          </Piece>
        </group>
      )
    case 'set-big':
      return (
        <group>
          <Board width={4.6} depth={2.8} height={0.26} />
          <Piece x={-1.55} z={-0.45} scale={0.5} rotation={-0.35}>
            {philadelphia}
          </Piece>
          <Piece x={-0.35} z={-0.6} scale={0.48} rotation={-0.35}>
            {makiSalmon}
          </Piece>
          <Piece x={0.85} z={-0.45} scale={0.48} rotation={-0.35}>
            {california}
          </Piece>
          <group position={[-0.6, 0, 0.75]} scale={0.48} rotation-y={0.2}>
            <Nigiri />
          </group>
          <group position={[1.0, 0, 0.75]} scale={0.48} rotation-y={0.2}>
            <Nigiri fish={materials.tunaSlice} seed={12} />
          </group>
        </group>
      )
  }
}

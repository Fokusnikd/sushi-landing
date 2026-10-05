import { Color, DoubleSide, MeshPhysicalMaterial, MeshStandardMaterial, Vector3 } from 'three'

// Deterministic PRNG so rice grains land in the same places on every render
export function seededRandom(seed: number) {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type StreakOptions = {
  color: string
  streak: string
  frequency?: number
  sharpness?: number
  // How much the streaks wobble; low values give near-parallel lines
  warp?: number
  weights?: [number, number, number]
  roughness?: number
  clearcoat?: number
}

// Glossy material with procedural streaks: fat lines on salmon, grain on wood, torch marks on sauce.
// The streaks follow object-space position, so they need no UVs.
function streaked({
  color,
  streak,
  frequency = 6,
  sharpness = 0.8,
  warp = 0.9,
  weights = [1, 0.35, 0.65],
  roughness = 0.35,
  clearcoat = 0.7,
}: StreakOptions) {
  const material = new MeshPhysicalMaterial({ color, roughness, clearcoat, clearcoatRoughness: 0.2 })
  material.onBeforeCompile = (shader) => {
    shader.uniforms.streakColor = { value: new Color(streak) }
    shader.uniforms.streakFrequency = { value: frequency }
    shader.uniforms.streakSharpness = { value: sharpness }
    shader.uniforms.streakWarp = { value: warp }
    shader.uniforms.streakWeights = { value: new Vector3(...weights) }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vStreakPosition;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvStreakPosition = position;')
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vStreakPosition;
uniform vec3 streakColor;
uniform float streakFrequency;
uniform float streakSharpness;
uniform float streakWarp;
uniform vec3 streakWeights;`,
      )
      .replace(
        'vec4 diffuseColor = vec4( diffuse, opacity );',
        `float streakWave = sin(dot(vStreakPosition, streakWeights) * streakFrequency
  + sin(vStreakPosition.z * 3.1 + vStreakPosition.x * 1.7) * streakWarp);
vec4 diffuseColor = vec4( mix( diffuse, streakColor, smoothstep( streakSharpness, 1.0, streakWave ) ), opacity );`,
      )
  }
  // Same shader code for every streaked material, only uniforms differ
  material.customProgramCacheKey = () => 'streaked'
  return material
}

export const materials = {
  rice: new MeshPhysicalMaterial({ color: '#fff9ee', roughness: 0.43, clearcoat: 0.12, clearcoatRoughness: 0.45 }),
  nori: new MeshStandardMaterial({ color: '#1f2e22', roughness: 0.55, side: DoubleSide }),
  salmon: streaked({ color: '#ed794f', streak: '#ffd9c2', frequency: 13, sharpness: 0.86, clearcoat: 0.25 }),
  // Flat nigiri slices read better with calmer, more parallel streaks
  salmonSlice: streaked({
    color: '#ff7a38',
    streak: '#ffd9c2',
    frequency: 12,
    sharpness: 0.84,
    warp: 0.25,
    weights: [1, 0, 0.6],
    roughness: 0.6,
    clearcoat: 0,
  }),
  tunaSlice: streaked({
    color: '#d42f45',
    streak: '#f07686',
    frequency: 7,
    sharpness: 0.9,
    warp: 0.25,
    weights: [1, 0, 0.6],
    roughness: 0.6,
    clearcoat: 0,
  }),
  eel: streaked({ color: '#6b3311', streak: '#a35a2b', frequency: 9, sharpness: 0.72, roughness: 0.22, clearcoat: 1 }),
  crab: streaked({ color: '#fff4ef', streak: '#ff7a68', frequency: 10, sharpness: 0.66 }),
  sauce: streaked({
    color: '#f8a64f',
    streak: '#c4621a',
    frequency: 11,
    sharpness: 0.86,
    weights: [1, 0.2, 1.3],
    roughness: 0.5,
    clearcoat: 0.3,
  }),
  wood: streaked({ color: '#a47a52', streak: '#896240', frequency: 90, sharpness: 0.48,
    warp: 3.8, weights: [0.03, 0.25, 1], roughness: 0.65, clearcoat: 0.06 }),
  handle: streaked({
    color: '#39302a',
    streak: '#201e1b',
    frequency: 22,
    sharpness: 0.6,
    weights: [1, 0.1, 0.1],
    roughness: 0.4,
    clearcoat: 0.6,
  }),
  cream: new MeshPhysicalMaterial({ color: '#fff5df', roughness: 0.56, clearcoat: 0.08 }),
  avocado: new MeshPhysicalMaterial({ color: '#8fc451', roughness: 0.4, clearcoat: 0.4 }),
  cucumber: new MeshPhysicalMaterial({ color: '#4ea83a', roughness: 0.4, clearcoat: 0.4 }),
  cucumberCore: new MeshStandardMaterial({ color: '#b6d574', roughness: 0.48 }),
  roe: new MeshPhysicalMaterial({ color: '#ff6a1c', roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05 }),
  tobiko: new MeshPhysicalMaterial({ color: '#ff8a1c', roughness: 0.3, clearcoat: 0.8 }),
  unagi: new MeshPhysicalMaterial({ color: '#3b1707', roughness: 0.15, clearcoat: 1 }),
  sesame: new MeshStandardMaterial({ color: '#fff3d1', roughness: 0.6 }),
  scallion: new MeshStandardMaterial({ color: '#5fb043', roughness: 0.5 }),
  // Not fully metallic: a pure mirror would reflect the empty (dark) background and turn black
  blade: new MeshPhysicalMaterial({ color: '#d9e0e0', metalness: 0.65, roughness: 0.26, clearcoat: 0.25, envMapIntensity: 1.4 }),
  steel: new MeshPhysicalMaterial({ color: '#c9d2dc', metalness: 0.85, roughness: 0.19 }),
}

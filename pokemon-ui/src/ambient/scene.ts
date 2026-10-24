export const MAX_DEVICE_PIXEL_RATIO = 1.5
export const PARALLAX_LIMIT_PX = 15
export const DUST_COUNT = 62
export const RAIN_COUNT = 84
export const PETAL_COUNT = 10

/** Landscape and desktop viewports. Portrait phones and a vertical monitor stay on the forest. */
export const LANDSCAPE_SCENE_QUERY = '(orientation: landscape) and (min-aspect-ratio: 1/1)'

export const FOREST_IMAGE = { width: 1536, height: 2752 }
export const PORCH_IMAGE = { width: 1672, height: 942 }

/** Keeps Pikachu, who sits near the middle of the pond painting, in frame when cover crops. */
export const FOREST_FOCAL = { x: 0.5, y: 0.6 }
/** Keeps Pikachu, who sits in the left third of the porch painting, in frame when cover crops. */
export const PORCH_FOCAL = { x: 0.24, y: 0.58 }

export const FOREST_RAY_ORIGIN = { nx: 0.3, ny: -0.02 }
export const PORCH_SUN = { nx: 0.62, ny: 0.33 }

export const FOREST_RIPPLES = [
  { nx: 0.24, ny: 0.73 },
  { nx: 0.38, ny: 0.77 },
  { nx: 0.5, ny: 0.745 },
  { nx: 0.32, ny: 0.81 },
] as const

export const PORCH_LANTERNS = [
  { nx: 0.15, ny: 0.2, radius: 78, phase: 0.4 },
  { nx: 0.27, ny: 0.16, radius: 92, phase: 1.7 },
  { nx: 0.36, ny: 0.23, radius: 70, phase: 3.1 },
  { nx: 0.89, ny: 0.45, radius: 84, phase: 2.2 },
] as const

export const PORCH_PUDDLES = [
  { nx: 0.47, ny: 0.8 },
  { nx: 0.58, ny: 0.88 },
  { nx: 0.66, ny: 0.76 },
  { nx: 0.53, ny: 0.7 },
] as const

export type SceneId = 'forest' | 'porch'

export interface CoverLayout {
  scale: number
  offsetX: number
  offsetY: number
  renderedWidth: number
  renderedHeight: number
}

export interface DustMote {
  x: number
  y: number
  radius: number
  speed: number
  sway: number
  swaySpeed: number
  phase: number
  alpha: number
  warm: boolean
}

export interface RainStreak {
  x: number
  y: number
  length: number
  speed: number
  slant: number
  alpha: number
  thickness: number
}

export interface Ripple {
  nx: number
  ny: number
  age: number
  duration: number
  maxRadius: number
}

export interface Petal {
  x: number
  y: number
  size: number
  speed: number
  sway: number
  swaySpeed: number
  phase: number
  spin: number
  spinSpeed: number
  alpha: number
}

export interface SceneState {
  dust: DustMote[]
  rain: RainStreak[]
  ripples: Ripple[]
  petals: Petal[]
}

export function sceneForLandscape(matchesLandscape: boolean): SceneId {
  return matchesLandscape ? 'porch' : 'forest'
}

export function sceneImage(scene: SceneId): { width: number; height: number } {
  return scene === 'porch' ? PORCH_IMAGE : FOREST_IMAGE
}

export function sceneFocal(scene: SceneId): { x: number; y: number } {
  return scene === 'porch' ? PORCH_FOCAL : FOREST_FOCAL
}

export function cappedDevicePixelRatio(dpr: number, max = MAX_DEVICE_PIXEL_RATIO): number {
  if (!Number.isFinite(dpr) || dpr <= 0) return 1
  return Math.min(dpr, max)
}

export function readPrefersReducedMotion(): boolean {
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function coverLayout(
  viewportWidth: number,
  viewportHeight: number,
  imageWidth: number,
  imageHeight: number,
  focalX: number,
  focalY: number,
): CoverLayout {
  if (viewportWidth <= 0 || viewportHeight <= 0 || imageWidth <= 0 || imageHeight <= 0) {
    return {
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      renderedWidth: imageWidth,
      renderedHeight: imageHeight,
    }
  }

  const scale = Math.max(viewportWidth / imageWidth, viewportHeight / imageHeight)
  const renderedWidth = imageWidth * scale
  const renderedHeight = imageHeight * scale
  return {
    scale,
    offsetX: focalX * viewportWidth - focalX * renderedWidth,
    offsetY: focalY * viewportHeight - focalY * renderedHeight,
    renderedWidth,
    renderedHeight,
  }
}

export function imagePointToScreen(
  nx: number,
  ny: number,
  layout: CoverLayout,
): { x: number; y: number } {
  return {
    x: layout.offsetX + nx * layout.renderedWidth,
    y: layout.offsetY + ny * layout.renderedHeight,
  }
}

export function parallaxOffset(
  clientX: number,
  clientY: number,
  width: number,
  height: number,
  limit = PARALLAX_LIMIT_PX,
): { x: number; y: number } {
  if (width <= 0 || height <= 0) return { x: 0, y: 0 }
  const nx = Math.min(1, Math.max(-1, (clientX / width) * 2 - 1))
  const ny = Math.min(1, Math.max(-1, (clientY / height) * 2 - 1))
  return { x: nx * limit, y: ny * limit }
}

export function createRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 4294967296
  }
}

export function createSceneState(random: () => number = Math.random): SceneState {
  const dust: DustMote[] = Array.from({ length: DUST_COUNT }, () => ({
    x: random(),
    y: random(),
    radius: 1.1 + random() * 2.1,
    speed: 0.02 + random() * 0.035,
    sway: 10 + random() * 16,
    swaySpeed: 0.55 + random() * 0.7,
    phase: random() * Math.PI * 2,
    alpha: 0.28 + random() * 0.5,
    warm: random() > 0.42,
  }))

  const rain: RainStreak[] = Array.from({ length: RAIN_COUNT }, () => ({
    x: random() * 1.2 - 0.1,
    y: random(),
    length: 22 + random() * 26,
    speed: 0.7 + random() * 0.5,
    slant: 0.16 + random() * 0.18,
    alpha: 0.34 + random() * 0.4,
    thickness: 1.25 + random() * 1.05,
  }))

  const rippleSources = [...FOREST_RIPPLES, ...PORCH_PUDDLES]
  const ripples: Ripple[] = rippleSources.map((point, index) => ({
    nx: point.nx,
    ny: point.ny,
    age: random(),
    duration: 2.6 + (index % 4) * 0.45,
    maxRadius: 36 + random() * 34,
  }))

  const petals: Petal[] = Array.from({ length: PETAL_COUNT }, () => ({
    x: 0.64 + random() * 0.42,
    y: -0.35 + random() * 1.1,
    size: 5 + random() * 6,
    speed: 0.05 + random() * 0.055,
    sway: 14 + random() * 28,
    swaySpeed: 0.7 + random() * 0.8,
    phase: random() * Math.PI * 2,
    spin: random() * Math.PI * 2,
    spinSpeed: 0.4 + random() * 0.9,
    alpha: 0.62 + random() * 0.32,
  }))

  return { dust, rain, ripples, petals }
}

export function stepDust(mote: DustMote, dt: number): void {
  mote.y -= mote.speed * dt
  if (mote.y < -0.06) mote.y += 1.12
}

export function dustSway(mote: DustMote, time: number): number {
  return Math.sin(time * mote.swaySpeed + mote.phase) * mote.sway
}

export function stepRain(streak: RainStreak, dt: number, random: () => number = Math.random): void {
  streak.y += streak.speed * dt
  streak.x += streak.slant * streak.speed * dt
  if (streak.y > 1.12) {
    streak.y = -0.08 - random() * 0.18
    streak.x = random() * 1.15 - 0.08
  }
}

export function stepRipple(ripple: Ripple, dt: number): void {
  ripple.age += dt / ripple.duration
  if (ripple.age >= 1) ripple.age %= 1
}

export function stepPetal(petal: Petal, dt: number, random: () => number = Math.random): void {
  petal.y += petal.speed * dt
  petal.spin += petal.spinSpeed * dt
  if (petal.y > 1.12) {
    petal.y = -0.08 - random() * 0.4
    petal.x = 0.66 + random() * 0.4
  }
}

export function stepScene(state: SceneState, dt: number, random: () => number = Math.random): void {
  const bounded = Math.min(0.05, Math.max(0, dt))
  for (const mote of state.dust) stepDust(mote, bounded)
  for (const streak of state.rain) stepRain(streak, bounded, random)
  for (const ripple of state.ripples) stepRipple(ripple, bounded)
  for (const petal of state.petals) stepPetal(petal, bounded, random)
}

export function lanternIntensity(phase: number, time: number): number {
  const slow = 0.62 + 0.38 * Math.sin(time * 2.1 + phase)
  const flicker = 0.82 + 0.18 * Math.sin(time * 14 + phase * 2)
  return Math.min(1, Math.max(0, slow * flicker))
}

export interface SceneController {
  start(): void
  stop(): void
  setReducedMotion(value: boolean): void
  setHidden(value: boolean): void
  isRunning(): boolean
}

export function createSceneController(options: {
  reducedMotion: boolean
  hidden: boolean
  onFrame: (timestamp: number) => void
  requestFrame?: (callback: FrameRequestCallback) => number
  cancelFrame?: (handle: number) => void
}): SceneController {
  let reduced = options.reducedMotion
  let hidden = options.hidden
  let active = false
  let scheduled = false
  let frameId = 0
  const requestFrame = options.requestFrame ?? requestAnimationFrame
  const cancelFrame = options.cancelFrame ?? cancelAnimationFrame

  function canRun(): boolean {
    return active && !reduced && !hidden
  }

  function cancel(): void {
    if (!scheduled) return
    cancelFrame(frameId)
    scheduled = false
  }

  function schedule(): void {
    if (scheduled || !canRun()) return
    scheduled = true
    frameId = requestFrame((time) => {
      scheduled = false
      if (!canRun()) return
      options.onFrame(time)
      schedule()
    })
  }

  return {
    start() {
      active = true
      schedule()
    },
    stop() {
      active = false
      cancel()
    },
    setReducedMotion(value: boolean) {
      reduced = value
      if (canRun()) schedule()
      else cancel()
    },
    setHidden(value: boolean) {
      hidden = value
      if (canRun()) schedule()
      else cancel()
    },
    isRunning: () => scheduled,
  }
}

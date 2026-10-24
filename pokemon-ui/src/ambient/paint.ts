import {
  FOREST_RAY_ORIGIN,
  FOREST_RIPPLES,
  PORCH_LANTERNS,
  PORCH_PUDDLES,
  PORCH_SUN,
  coverLayout,
  dustSway,
  imagePointToScreen,
  lanternIntensity,
  sceneFocal,
  sceneImage,
  stepScene,
  type CoverLayout,
  type SceneId,
  type SceneState,
} from '@/ambient/scene'

interface RayDef {
  angle: number
  endWidth: number
  alpha: number
  phase: number
  length: number
}

const FOREST_RAYS: RayDef[] = [
  { angle: 0.58, endWidth: 90, alpha: 0.1, phase: 0.2, length: 1.05 },
  { angle: 0.82, endWidth: 140, alpha: 0.13, phase: 1.1, length: 1.2 },
  { angle: 1.05, endWidth: 70, alpha: 0.08, phase: 2.2, length: 1.15 },
  { angle: 1.28, endWidth: 160, alpha: 0.11, phase: 0.6, length: 1.25 },
  { angle: 1.5, endWidth: 110, alpha: 0.07, phase: 2.8, length: 1.1 },
  { angle: 1.72, endWidth: 80, alpha: 0.06, phase: 1.7, length: 0.95 },
]

const PORCH_RAYS: RayDef[] = [
  { angle: -2.15, endWidth: 70, alpha: 0.1, phase: 0.4, length: 0.72 },
  { angle: -1.8, endWidth: 120, alpha: 0.16, phase: 1.3, length: 0.9 },
  { angle: -1.5, endWidth: 90, alpha: 0.12, phase: 2.1, length: 0.84 },
  { angle: -1.15, endWidth: 130, alpha: 0.14, phase: 0.8, length: 0.78 },
  { angle: -0.85, endWidth: 80, alpha: 0.08, phase: 2.6, length: 0.66 },
]

const PETAL_COLORS = ['#f7c1d0', '#e89aaf', '#ffd6e2', '#f3b7c4']

export function paintFrame(
  ctx: CanvasRenderingContext2D,
  state: SceneState,
  scene: SceneId,
  width: number,
  height: number,
  time: number,
  dt: number,
): void {
  if (width < 2 || height < 2) return
  stepScene(state, dt)
  ctx.clearRect(0, 0, width, height)

  const image = sceneImage(scene)
  const focal = sceneFocal(scene)
  const layout = coverLayout(width, height, image.width, image.height, focal.x, focal.y)

  if (scene === 'porch') {
    const sun = imagePointToScreen(PORCH_SUN.nx, PORCH_SUN.ny, layout)
    drawSun(ctx, sun.x, sun.y, width, height, time)
    drawRays(ctx, sun.x, sun.y, PORCH_RAYS, width, height, time, '255, 176, 96')
    drawLanterns(ctx, layout, time)
    drawRipples(ctx, state, layout, PORCH_PUDDLES, '255, 214, 150', time)
    drawPetals(ctx, state, width, height, time)
  } else {
    const origin = imagePointToScreen(FOREST_RAY_ORIGIN.nx, FOREST_RAY_ORIGIN.ny, layout)
    drawRays(ctx, origin.x, origin.y, FOREST_RAYS, width, height, time, '255, 214, 140')
    drawRipples(ctx, state, layout, FOREST_RIPPLES, '236, 244, 220', time)
    drawDust(ctx, state, width, height, time)
  }

  drawRain(ctx, state, width, height)
}

function drawRays(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  rays: RayDef[],
  width: number,
  height: number,
  time: number,
  rgb: string,
): void {
  const reach = Math.hypot(width, height)
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  for (const ray of rays) {
    const angle = ray.angle + Math.sin(time * 0.18 + ray.phase) * 0.028
    const alpha = ray.alpha * (0.6 + 0.4 * Math.sin(time * 0.42 + ray.phase))
    ctx.save()
    ctx.translate(originX, originY)
    ctx.rotate(angle)
    const length = reach * ray.length
    const gradient = ctx.createLinearGradient(0, 0, length, 0)
    gradient.addColorStop(0, `rgba(${rgb}, ${alpha})`)
    gradient.addColorStop(0.4, `rgba(${rgb}, ${alpha * 0.28})`)
    gradient.addColorStop(1, `rgba(${rgb}, 0)`)
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(length, ray.endWidth)
    ctx.lineTo(length, -ray.endWidth * 0.42)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }
  ctx.restore()
}

function drawSun(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  time: number,
): void {
  const pulse = 0.86 + 0.14 * Math.sin(time * 0.55)
  const glow = Math.min(width, height) * 0.38 * pulse
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, glow)
  gradient.addColorStop(0, `rgba(255, 220, 160, ${0.34 * pulse})`)
  gradient.addColorStop(0.28, `rgba(255, 150, 70, ${0.14 * pulse})`)
  gradient.addColorStop(1, 'rgba(255, 120, 40, 0)')
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(x, y, glow, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawLanterns(ctx: CanvasRenderingContext2D, layout: CoverLayout, time: number): void {
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  for (const lantern of PORCH_LANTERNS) {
    const point = imagePointToScreen(lantern.nx, lantern.ny, layout)
    const intensity = lanternIntensity(lantern.phase, time)
    const radius = lantern.radius * (0.82 + intensity * 0.35)
    const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius)
    gradient.addColorStop(0, `rgba(255, 246, 220, ${0.75 * intensity})`)
    gradient.addColorStop(0.22, `rgba(255, 176, 64, ${0.4 * intensity})`)
    gradient.addColorStop(0.6, `rgba(255, 110, 36, ${0.12 * intensity})`)
    gradient.addColorStop(1, 'rgba(255, 80, 20, 0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawRipples(
  ctx: CanvasRenderingContext2D,
  state: SceneState,
  layout: CoverLayout,
  points: readonly { nx: number; ny: number }[],
  rgb: string,
  time: number,
): void {
  ctx.save()
  ctx.lineCap = 'round'
  for (const ripple of state.ripples) {
    if (!points.some((point) => point.nx === ripple.nx && point.ny === ripple.ny)) continue
    const point = imagePointToScreen(ripple.nx, ripple.ny, layout)
    const radius = 6 + ripple.age * ripple.maxRadius
    const alpha = (1 - ripple.age) * (0.28 + 0.08 * Math.sin(time + ripple.nx * 8))
    ctx.beginPath()
    ctx.ellipse(point.x, point.y, Math.max(radius, 1), Math.max(radius * 0.34, 1), 0, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(${rgb}, ${alpha})`
    ctx.lineWidth = 1.35
    ctx.stroke()
  }
  ctx.restore()
}

function drawDust(
  ctx: CanvasRenderingContext2D,
  state: SceneState,
  width: number,
  height: number,
  time: number,
): void {
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  for (const mote of state.dust) {
    const x = mote.x * width + dustSway(mote, time)
    const y = mote.y * height
    const twinkle = 0.75 + 0.25 * Math.sin(time * 1.4 + mote.phase)
    ctx.globalAlpha = mote.alpha * twinkle
    ctx.fillStyle = mote.warm ? 'rgba(255, 214, 120, 1)' : 'rgba(255, 248, 236, 1)'
    ctx.beginPath()
    ctx.arc(x, y, mote.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = mote.alpha * 0.28 * twinkle
    ctx.beginPath()
    ctx.arc(x, y, mote.radius * 3.4, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawPetals(
  ctx: CanvasRenderingContext2D,
  state: SceneState,
  width: number,
  height: number,
  time: number,
): void {
  ctx.save()
  state.petals.forEach((petal, index) => {
    const x = petal.x * width + Math.sin(time * petal.swaySpeed + petal.phase) * petal.sway
    const y = petal.y * height
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(petal.spin)
    ctx.globalAlpha = petal.alpha
    ctx.fillStyle = PETAL_COLORS[index % PETAL_COLORS.length] ?? '#f7c1d0'
    ctx.beginPath()
    ctx.ellipse(0, 0, petal.size, petal.size * 0.55, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  })
  ctx.restore()
}

function drawRain(
  ctx: CanvasRenderingContext2D,
  state: SceneState,
  width: number,
  height: number,
): void {
  ctx.save()
  ctx.lineCap = 'round'
  ctx.strokeStyle = 'rgba(232, 240, 248, 0.85)'
  for (const streak of state.rain) {
    const x = streak.x * width
    const y = streak.y * height
    ctx.globalAlpha = streak.alpha
    ctx.lineWidth = streak.thickness
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x - streak.length * streak.slant, y - streak.length)
    ctx.stroke()
  }
  ctx.restore()
}

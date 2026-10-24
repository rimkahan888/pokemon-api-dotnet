import { describe, expect, it, vi } from 'vitest'
import {
  DUST_COUNT,
  FOREST_FOCAL,
  FOREST_IMAGE,
  FOREST_RAY_ORIGIN,
  LANDSCAPE_SCENE_QUERY,
  PARALLAX_LIMIT_PX,
  PETAL_COUNT,
  PORCH_FOCAL,
  PORCH_LANTERNS,
  PORCH_PUDDLES,
  PORCH_SUN,
  cappedDevicePixelRatio,
  coverLayout,
  createRng,
  createSceneController,
  createSceneState,
  dustSway,
  imagePointToScreen,
  lanternIntensity,
  parallaxOffset,
  readPrefersReducedMotion,
  sceneForLandscape,
  stepDust,
  stepPetal,
  stepRain,
  stepRipple,
} from '@/ambient/scene'

describe('scene', () => {
  it('keeps the forest focal point anchored when the portrait is cropped', () => {
    const layout = coverLayout(1920, 1080, FOREST_IMAGE.width, FOREST_IMAGE.height, FOREST_FOCAL.x, FOREST_FOCAL.y)
    const focal = imagePointToScreen(FOREST_FOCAL.x, FOREST_FOCAL.y, layout)
    const pond = imagePointToScreen(0.32, 0.72, layout)

    expect(focal.x).toBeCloseTo(960)
    expect(focal.y).toBeCloseTo(648)
    expect(pond.y).toBeGreaterThan(1000)
    expect(pond.y).toBeLessThan(1120)
  })

  it('keeps porch Pikachu inside a landscape frame that crops the sides', () => {
    const layout = coverLayout(1440, 1080, 1672, 942, PORCH_FOCAL.x, PORCH_FOCAL.y)
    const pikachu = imagePointToScreen(0.22, 0.58, layout)

    expect(PORCH_FOCAL.x).toBeLessThan(0.34)
    expect(pikachu.x).toBeGreaterThan(0)
    expect(pikachu.x).toBeLessThan(1440 * 0.4)
    expect(pikachu.y).toBeGreaterThan(0)
    expect(pikachu.y).toBeLessThan(1080)
  })

  it('chooses the porch on landscape viewports and the forest otherwise', () => {
    expect(sceneForLandscape(true)).toBe('porch')
    expect(sceneForLandscape(false)).toBe('forest')
    expect(LANDSCAPE_SCENE_QUERY).toContain('orientation: landscape')
    expect(LANDSCAPE_SCENE_QUERY).toContain('min-aspect-ratio')
  })

  it('places forest rays at the top left and the porch sun on the centre-right horizon', () => {
    expect(FOREST_RAY_ORIGIN.nx).toBeLessThan(0.45)
    expect(FOREST_RAY_ORIGIN.ny).toBeLessThan(0.1)
    expect(PORCH_SUN.nx).toBeGreaterThan(0.5)
    expect(PORCH_SUN.ny).toBeGreaterThan(0.2)
    expect(PORCH_SUN.ny).toBeLessThan(0.5)
    expect(PORCH_LANTERNS.some((lantern) => lantern.nx < 0.4)).toBe(true)
    expect(PORCH_LANTERNS.some((lantern) => lantern.nx > 0.7)).toBe(true)
    expect(PORCH_PUDDLES.every((puddle) => puddle.ny > 0.65)).toBe(true)
  })

  it('caps the device pixel ratio', () => {
    expect(cappedDevicePixelRatio(2.5)).toBe(1.5)
    expect(cappedDevicePixelRatio(1.25)).toBe(1.25)
    expect(cappedDevicePixelRatio(Number.NaN)).toBe(1)
    expect(cappedDevicePixelRatio(0)).toBe(1)
  })

  it('limits parallax to about 15px', () => {
    expect(parallaxOffset(0, 0, 1000, 800)).toEqual({ x: -PARALLAX_LIMIT_PX, y: -PARALLAX_LIMIT_PX })
    expect(parallaxOffset(1000, 800, 1000, 800)).toEqual({ x: PARALLAX_LIMIT_PX, y: PARALLAX_LIMIT_PX })
    expect(parallaxOffset(500, 400, 1000, 800)).toEqual({ x: 0, y: 0 })
    expect(parallaxOffset(10, 10, 0, 0)).toEqual({ x: 0, y: 0 })
  })

  it('drifts dust upward with a sine sway and wraps past the top', () => {
    const state = createSceneState(createRng(7))
    expect(state.dust).toHaveLength(DUST_COUNT)
    expect(DUST_COUNT).toBeGreaterThanOrEqual(50)
    expect(DUST_COUNT).toBeLessThanOrEqual(70)

    const mote = state.dust[0]
    expect(mote).toBeDefined()
    if (!mote) return
    mote.y = 0.5
    mote.speed = 0.2
    stepDust(mote, 0.5)
    expect(mote.y).toBeCloseTo(0.4)

    mote.y = -0.07
    stepDust(mote, 0)
    expect(mote.y).toBeGreaterThan(1)

    mote.sway = 18
    mote.swaySpeed = 1
    mote.phase = 0
    expect(dustSway(mote, Math.PI / 2)).toBeCloseTo(18)
  })

  it('moves rain down and to the right', () => {
    const streak = {
      x: 0.2,
      y: 0.2,
      length: 20,
      speed: 0.5,
      slant: 0.2,
      alpha: 0.3,
      thickness: 1,
    }
    stepRain(streak, 0.4, () => 0)
    expect(streak.y).toBeCloseTo(0.4)
    expect(streak.x).toBeCloseTo(0.24)

    streak.y = 1.2
    stepRain(streak, 0, () => 0.5)
    expect(streak.y).toBeLessThan(0)
    expect(streak.x).toBeCloseTo(0.5 * 1.15 - 0.08)
  })

  it('drops petals from the top right and restarts them there', () => {
    const state = createSceneState(createRng(3))
    expect(state.petals).toHaveLength(PETAL_COUNT)
    const petal = state.petals[0]
    expect(petal).toBeDefined()
    if (!petal) return
    const start = petal.y
    stepPetal(petal, 0.5, () => 0.1)
    expect(petal.y).toBeGreaterThan(start)

    petal.y = 1.2
    stepPetal(petal, 0, () => 0.2)
    expect(petal.y).toBeLessThan(0)
    expect(petal.x).toBeGreaterThan(0.6)
  })

  it('ages ripples and keeps lantern flicker in range', () => {
    const ripple = { nx: 0.5, ny: 0.8, age: 0.9, duration: 1, maxRadius: 40 }
    stepRipple(ripple, 0.2)
    expect(ripple.age).toBeCloseTo(0.1)

    expect(lanternIntensity(0.4, 1.2)).toBeGreaterThan(0)
    expect(lanternIntensity(0.4, 1.2)).toBeLessThanOrEqual(1)
  })

  it('does not schedule frames when reduced motion is preferred or the tab is hidden', () => {
    const requestFrame = vi.fn<(callback: FrameRequestCallback) => number>(() => 1)
    const cancelFrame = vi.fn()
    const onFrame = vi.fn()
    const reduced = createSceneController({
      reducedMotion: true,
      hidden: false,
      onFrame,
      requestFrame,
      cancelFrame,
    })

    reduced.start()
    expect(requestFrame).not.toHaveBeenCalled()
    expect(reduced.isRunning()).toBe(false)

    const hidden = createSceneController({
      reducedMotion: false,
      hidden: true,
      onFrame,
      requestFrame,
      cancelFrame,
    })
    hidden.start()
    expect(requestFrame).not.toHaveBeenCalled()

    hidden.setHidden(false)
    expect(requestFrame).toHaveBeenCalledTimes(1)
    expect(hidden.isRunning()).toBe(true)

    const callback = requestFrame.mock.calls[0]?.[0]
    expect(callback).toEqual(expect.any(Function))
    if (!callback) return
    callback(16)
    expect(onFrame).toHaveBeenCalledWith(16)
    expect(requestFrame).toHaveBeenCalledTimes(2)

    hidden.setReducedMotion(true)
    expect(cancelFrame).toHaveBeenCalled()
    expect(hidden.isRunning()).toBe(false)

    hidden.stop()
    expect(readPrefersReducedMotion()).toBe(false)
  })
})

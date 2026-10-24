<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import {
  forestAvifSrcset,
  forestJpegFallback,
  forestJpegSrcset,
  forestWebpSrcset,
  porchAvifSrcset,
  porchJpegSrcset,
  porchWebpSrcset,
} from '@/ambient/backgroundSources'
import { paintFrame } from '@/ambient/paint'
import {
  LANDSCAPE_SCENE_QUERY,
  PARALLAX_LIMIT_PX,
  cappedDevicePixelRatio,
  createSceneController,
  createSceneState,
  parallaxOffset,
  readPrefersReducedMotion,
  sceneForLandscape,
  type SceneController,
  type SceneId,
  type SceneState,
} from '@/ambient/scene'

const scene = ref<SceneId>(sceneForLandscape(queryMatches(LANDSCAPE_SCENE_QUERY)))
const reducedMotion = ref(readPrefersReducedMotion())
const paused = ref(typeof document !== 'undefined' && document.hidden === true)

const shiftEl = ref<HTMLElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)

let ctx: CanvasRenderingContext2D | null = null
let state: SceneState | null = null
let controller: SceneController | null = null
let resizeObserver: ResizeObserver | null = null
let lastFrame = 0
let offsetX = 0
let offsetY = 0
let targetX = 0
let targetY = 0
let parallaxEnabled = false

function queryMatches(query: string): boolean {
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia(query).matches
}

function mediaQuery(query: string): MediaQueryList | null {
  if (typeof window.matchMedia !== 'function') return null
  return window.matchMedia(query)
}

function resetShift(): void {
  offsetX = 0
  offsetY = 0
  targetX = 0
  targetY = 0
  if (shiftEl.value) shiftEl.value.style.transform = ''
}

function applyShift(): void {
  if (!shiftEl.value) return
  shiftEl.value.style.transform = `translate3d(${offsetX.toFixed(2)}px, ${offsetY.toFixed(2)}px, 0)`
}

function resize(): void {
  const canvas = canvasEl.value
  if (!canvas || !ctx) return
  const cssWidth = canvas.clientWidth
  const cssHeight = canvas.clientHeight
  const dpr = cappedDevicePixelRatio(window.devicePixelRatio || 1)
  const nextWidth = Math.max(1, Math.round(cssWidth * dpr))
  const nextHeight = Math.max(1, Math.round(cssHeight * dpr))
  if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
    canvas.width = nextWidth
    canvas.height = nextHeight
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function onFrame(now: number): void {
  if (!ctx || !state || !canvasEl.value) return
  const dt = lastFrame === 0 ? 0 : Math.min(0.05, Math.max(0, (now - lastFrame) / 1000))
  lastFrame = now
  const blend = dt === 0 ? 1 : Math.min(1, dt * 5)
  offsetX += (targetX - offsetX) * blend
  offsetY += (targetY - offsetY) * blend
  applyShift()
  paintFrame(ctx, state, scene.value, canvasEl.value.clientWidth, canvasEl.value.clientHeight, now / 1000, dt)
}

function syncLoop(): void {
  if (!controller) return
  controller.setReducedMotion(reducedMotion.value)
  controller.setHidden(paused.value)
  if (reducedMotion.value || paused.value) {
    resetShift()
    lastFrame = 0
  }
}

function onLandscapeChange(event: MediaQueryListEvent): void {
  scene.value = sceneForLandscape(event.matches)
}

function onReducedChange(event: MediaQueryListEvent): void {
  reducedMotion.value = event.matches
  syncLoop()
}

function onVisibility(): void {
  paused.value = document.hidden === true
  syncLoop()
}

function onPointerMove(event: PointerEvent): void {
  if (!parallaxEnabled || reducedMotion.value || paused.value) return
  const next = parallaxOffset(event.clientX, event.clientY, window.innerWidth, window.innerHeight, PARALLAX_LIMIT_PX)
  targetX = next.x
  targetY = next.y
}

function onPointerLeave(): void {
  targetX = 0
  targetY = 0
}

function onPointerOut(event: PointerEvent): void {
  if (event.relatedTarget === null) onPointerLeave()
}

let landscapeQuery: MediaQueryList | null = null
let reducedQuery: MediaQueryList | null = null

onMounted(() => {
  landscapeQuery = mediaQuery(LANDSCAPE_SCENE_QUERY)
  reducedQuery = mediaQuery('(prefers-reduced-motion: reduce)')
  scene.value = sceneForLandscape(landscapeQuery?.matches ?? false)
  reducedMotion.value = reducedQuery?.matches ?? false
  paused.value = document.hidden === true
  parallaxEnabled = queryMatches('(pointer: fine)')

  landscapeQuery?.addEventListener('change', onLandscapeChange)
  reducedQuery?.addEventListener('change', onReducedChange)
  document.addEventListener('visibilitychange', onVisibility)

  const canvas = canvasEl.value
  ctx = canvas?.getContext('2d') ?? null
  if (!ctx || !canvas) return

  state = createSceneState()
  resize()
  if (typeof ResizeObserver === 'function') {
    resizeObserver = new ResizeObserver(() => resize())
    resizeObserver.observe(canvas)
  }

  if (parallaxEnabled) {
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerout', onPointerOut)
  }

  controller = createSceneController({
    reducedMotion: reducedMotion.value,
    hidden: paused.value,
    onFrame,
  })
  controller.start()
})

onUnmounted(() => {
  controller?.stop()
  resizeObserver?.disconnect()
  landscapeQuery?.removeEventListener('change', onLandscapeChange)
  reducedQuery?.removeEventListener('change', onReducedChange)
  document.removeEventListener('visibilitychange', onVisibility)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerout', onPointerOut)
})
</script>

<template>
  <div
    class="ambient"
    data-ambient-root
    :data-motion="reducedMotion ? 'reduced' : 'live'"
    :data-paused="paused ? 'true' : 'false'"
    :data-scene="scene"
    aria-hidden="true"
  >
    <div ref="shiftEl" class="ambient-shift">
      <picture class="ambient-picture">
        <source
          :media="LANDSCAPE_SCENE_QUERY"
          type="image/avif"
          :srcset="porchAvifSrcset"
          sizes="100vw"
        />
        <source
          :media="LANDSCAPE_SCENE_QUERY"
          type="image/webp"
          :srcset="porchWebpSrcset"
          sizes="100vw"
        />
        <source
          :media="LANDSCAPE_SCENE_QUERY"
          type="image/jpeg"
          :srcset="porchJpegSrcset"
          sizes="100vw"
        />
        <source type="image/avif" :srcset="forestAvifSrcset" sizes="100vw" />
        <source type="image/webp" :srcset="forestWebpSrcset" sizes="100vw" />
        <source type="image/jpeg" :srcset="forestJpegSrcset" sizes="100vw" />
        <img
          class="ambient-img"
          :src="forestJpegFallback"
          :srcset="forestJpegSrcset"
          sizes="100vw"
          alt=""
          decoding="async"
          fetchpriority="high"
        />
      </picture>
      <canvas ref="canvasEl" class="ambient-canvas" />
    </div>
    <div class="ambient-shade" />
  </div>
</template>

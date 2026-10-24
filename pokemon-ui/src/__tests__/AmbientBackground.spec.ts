import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AmbientBackground from '@/components/AmbientBackground.vue'
import { LANDSCAPE_SCENE_QUERY } from '@/ambient/scene'

function mockMatchMedia(matches: (query: string) => boolean) {
  window.matchMedia = vi.fn((query: string) => ({
    matches: matches(query),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

function stubCanvas(): void {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    setTransform: vi.fn(),
    clearRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D)
}

function setDocumentHidden(hidden: boolean): void {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => (hidden ? 'hidden' : 'visible'),
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  Reflect.deleteProperty(window, 'matchMedia')
  Reflect.deleteProperty(document, 'hidden')
  Reflect.deleteProperty(document, 'visibilityState')
})

describe('AmbientBackground', () => {
  it('uses the porch art on landscape and the forest art on portrait', () => {
    mockMatchMedia(() => false)
    const wrapper = mount(AmbientBackground)
    const sources = wrapper.findAll('source')
    const landscape = sources.filter((source) => source.attributes('media') === LANDSCAPE_SCENE_QUERY)
    const portrait = sources.filter((source) => !source.attributes('media'))

    expect(landscape.map((source) => source.attributes('type'))).toEqual([
      'image/avif',
      'image/webp',
      'image/jpeg',
    ])
    expect(landscape[0]?.attributes('srcset')).toContain('800w')
    expect(landscape[0]?.attributes('srcset')).toContain('1672w')
    expect(portrait.map((source) => source.attributes('type'))).toEqual([
      'image/avif',
      'image/webp',
      'image/jpeg',
    ])
    expect(portrait[0]?.attributes('srcset')).toContain('640w')
    expect(portrait[0]?.attributes('srcset')).toContain('1536w')
    expect(wrapper.get('img').attributes('srcset')).toContain('1024w')
    expect(wrapper.get('[data-ambient-root]').attributes('data-scene')).toBe('forest')
  })

  it('freezes the backdrop when reduced motion is preferred', () => {
    const requestFrame = vi.fn(() => 1)
    vi.stubGlobal('requestAnimationFrame', requestFrame)
    mockMatchMedia((query) => query.includes('prefers-reduced-motion'))

    const wrapper = mount(AmbientBackground)

    expect(wrapper.get('[data-ambient-root]').attributes('data-motion')).toBe('reduced')
    expect(requestFrame).not.toHaveBeenCalled()
    expect(wrapper.get('img').attributes('alt')).toBe('')
  })

  it('does not run the canvas while the document is hidden', () => {
    const requestFrame = vi.fn(() => 1)
    vi.stubGlobal('requestAnimationFrame', requestFrame)
    mockMatchMedia(() => false)
    stubCanvas()
    setDocumentHidden(true)
    const wrapper = mount(AmbientBackground)

    expect(wrapper.get('[data-ambient-root]').attributes('data-paused')).toBe('true')
    expect(wrapper.get('[data-ambient-root]').attributes('data-motion')).toBe('live')
    expect(requestFrame).not.toHaveBeenCalled()
  })

  it('starts the canvas when the page is visible and motion is allowed', () => {
    const requestFrame = vi.fn(() => 1)
    vi.stubGlobal('requestAnimationFrame', requestFrame)
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    mockMatchMedia(() => false)
    stubCanvas()
    setDocumentHidden(false)

    const wrapper = mount(AmbientBackground)

    expect(wrapper.get('[data-ambient-root]').attributes('data-paused')).toBe('false')
    expect(requestFrame).toHaveBeenCalled()
  })
})

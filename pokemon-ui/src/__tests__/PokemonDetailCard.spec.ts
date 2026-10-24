import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PokemonDetailCard from '@/components/PokemonDetailCard.vue'
import type { PokemonDetail } from '@/types/pokemon'

const pikachu: PokemonDetail = {
  id: 25,
  name: 'pikachu',
  types: ['electric'],
  abilities: ['static'],
  stats: [{ name: 'speed', value: 90 }],
  spriteUrl: 'sprite',
}

function mockMatchMedia(reduced: boolean) {
  window.matchMedia = vi.fn(() => ({
    matches: reduced,
    media: '',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

function mountCard() {
  return mount(PokemonDetailCard, {
    props: {
      pokemon: pikachu,
      isLoading: false,
      error: '',
      isFavorite: false,
      isOnTeam: false,
      isTeamFull: false,
    },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  Reflect.deleteProperty(window, 'matchMedia')
})

describe('PokemonDetailCard motion', () => {
  it('fills stat meters immediately when reduced motion is preferred', () => {
    mockMatchMedia(true)
    const wrapper = mountCard()
    expect(wrapper.get('meter').attributes('value')).toBe('90')
    expect(wrapper.get('.type-glow').attributes('style')).toContain('#f7d02c')
  })

  it('starts stat meters at zero before the fill animation runs', () => {
    mockMatchMedia(false)
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    const wrapper = mountCard()
    expect(wrapper.get('meter').attributes('value')).toBe('0')
  })
})

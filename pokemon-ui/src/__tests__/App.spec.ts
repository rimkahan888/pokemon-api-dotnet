import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '@/App.vue'
import * as pokemonApi from '@/services/pokemonApi'

vi.mock('@/services/pokemonApi', () => ({
  fetchPokemonPage: vi.fn(),
  fetchPokemonDetail: vi.fn(),
}))

const mockedFetchPokemonPage = vi.mocked(pokemonApi.fetchPokemonPage)
const mockedFetchPokemonDetail = vi.mocked(pokemonApi.fetchPokemonDetail)

afterEach(() => {
  vi.clearAllMocks()
})

describe('App.vue', () => {
  it('shows loading state while list request is pending', async () => {
    mockedFetchPokemonPage.mockReturnValue(new Promise(() => {}))

    const wrapper = mount(App)
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Loading list...')
  })

  it('shows list error when page request fails', async () => {
    mockedFetchPokemonPage.mockRejectedValue(new Error('List failed'))

    const wrapper = mount(App)
    await flush()

    expect(wrapper.text()).toContain('List failed')
  })

  it('shows detail error when selected pokemon request fails', async () => {
    mockedFetchPokemonPage.mockResolvedValue({
      page: 1,
      size: 20,
      totalCount: 1,
      totalPages: 1,
      items: [
        { id: 25, name: 'pikachu', spriteUrl: 'sprite' },
      ],
    })
    mockedFetchPokemonDetail.mockRejectedValue(new Error('Details failed'))

    const wrapper = mount(App)
    await flush()

    await wrapper.get('button.item').trigger('click')
    await flush()

    expect(wrapper.text()).toContain('Details failed')
  })

  it('shows empty-state when API returns no items', async () => {
    mockedFetchPokemonPage.mockResolvedValue({
      page: 1,
      size: 20,
      totalCount: 0,
      totalPages: 0,
      items: [],
    })

    const wrapper = mount(App)
    await flush()

    expect(wrapper.text()).toContain('No Pokémon found.')
  })

  it('shows detail state after selecting a pokemon', async () => {
    mockedFetchPokemonPage.mockResolvedValue({
      page: 1,
      size: 20,
      totalCount: 1,
      totalPages: 1,
      items: [
        { id: 25, name: 'pikachu', spriteUrl: 'sprite' },
      ],
    })

    mockedFetchPokemonDetail.mockResolvedValue({
      id: 25,
      name: 'pikachu',
      types: ['electric'],
      abilities: ['static'],
      stats: [{ name: 'speed', value: 55 }],
      spriteUrl: 'sprite',
    })

    const wrapper = mount(App)
    await flush()

    await wrapper.get('button.item').trigger('click')
    await flush()

    expect(wrapper.text()).toContain('#25 pikachu')
    expect(wrapper.text()).toContain('Types: electric')
    expect(wrapper.text()).toContain('Abilities: static')
  })
})

async function flush(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
}

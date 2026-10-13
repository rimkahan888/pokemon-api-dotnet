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
  vi.useRealTimers()
  localStorage.removeItem('pokemon-favorite-ids')
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

  it('toggles a Pokémon favorite and persists favorite IDs', async () => {
    mockedFetchPokemonPage.mockResolvedValue({
      page: 1,
      size: 20,
      totalCount: 1,
      totalPages: 1,
      items: [{ id: 25, name: 'pikachu', spriteUrl: 'sprite' }],
    })
    mockedFetchPokemonDetail.mockResolvedValue({
      id: 25,
      name: 'pikachu',
      types: ['electric'],
      abilities: ['static'],
      stats: [],
      spriteUrl: 'sprite',
    })

    const wrapper = mount(App)
    await flush()
    await wrapper.get('button.item').trigger('click')
    await flush()

    const favoriteButton = wrapper.get('button[aria-label="Add to favorites"]')
    await favoriteButton.trigger('click')

    expect(wrapper.get('button[aria-label="Remove from favorites"]').attributes('aria-pressed')).toBe('true')
    expect(localStorage.getItem('pokemon-favorite-ids')).toBe('[25]')

    await wrapper.get('button[aria-label="Remove from favorites"]').trigger('click')

    expect(wrapper.get('button[aria-label="Add to favorites"]').attributes('aria-pressed')).toBe('false')
    expect(localStorage.getItem('pokemon-favorite-ids')).toBe('[]')
  })

  it('restores saved favorites when displaying a Pokémon', async () => {
    localStorage.setItem('pokemon-favorite-ids', '[25]')
    mockedFetchPokemonPage.mockResolvedValue({
      page: 1,
      size: 20,
      totalCount: 1,
      totalPages: 1,
      items: [{ id: 25, name: 'pikachu', spriteUrl: 'sprite' }],
    })
    mockedFetchPokemonDetail.mockResolvedValue({
      id: 25,
      name: 'pikachu',
      types: ['electric'],
      abilities: ['static'],
      stats: [],
      spriteUrl: 'sprite',
    })

    const wrapper = mount(App)
    await flush()
    await wrapper.get('button.item').trigger('click')
    await flush()

    expect(wrapper.get('button[aria-label="Remove from favorites"]').attributes('aria-pressed')).toBe('true')
  })

  it('browses saved favorites and opens a selected Pokémon', async () => {
    localStorage.setItem('pokemon-favorite-ids', '[25,6]')
    mockedFetchPokemonPage.mockResolvedValue({
      page: 1,
      size: 20,
      totalCount: 1,
      totalPages: 1,
      items: [{ id: 25, name: 'pikachu', spriteUrl: 'sprite' }],
    })
    mockedFetchPokemonDetail.mockResolvedValue({
      id: 6,
      name: 'charizard',
      types: ['fire', 'flying'],
      abilities: ['blaze'],
      stats: [],
      spriteUrl: 'charizard-sprite',
    })

    const wrapper = mount(App)
    await flush()
    await wrapper.get('.viewTabs button:last-child').trigger('click')
    await flush()

    expect(wrapper.findAll('.list .item').map((button) => button.text())).toEqual(['#25 pikachu', '#6'])

    await wrapper.get('button[aria-label="View Pokémon #6"]').trigger('click')
    await flush()

    expect(mockedFetchPokemonDetail).toHaveBeenCalledWith('6')
    expect(wrapper.text()).toContain('#6 charizard')
  })

  it('shows an empty state when there are no saved favorites', async () => {
    mockedFetchPokemonPage.mockResolvedValue({
      page: 1,
      size: 20,
      totalCount: 0,
      totalPages: 0,
      items: [],
    })

    const wrapper = mount(App)
    await flush()
    await wrapper.get('.viewTabs button:last-child').trigger('click')

    expect(wrapper.text()).toContain('No favorites yet.')
    expect(wrapper.find('.pager').exists()).toBe(false)
  })

  it('searches for a Pokémon when the search form is submitted', async () => {
    mockedFetchPokemonPage.mockResolvedValue({
      page: 1,
      size: 20,
      totalCount: 0,
      totalPages: 0,
      items: [],
    })
    mockedFetchPokemonDetail.mockResolvedValue({
      id: 25,
      name: 'pikachu',
      types: ['electric'],
      abilities: ['static'],
      stats: [],
      spriteUrl: 'sprite',
    })

    const wrapper = mount(App)
    await flush()
    await wrapper.get('input[aria-label="Search Pokémon"]').setValue('pikachu')
    await wrapper.get('form').trigger('submit')
    await flush()

    expect(mockedFetchPokemonDetail).toHaveBeenCalledWith('pikachu')
    expect(wrapper.text()).toContain('#25 pikachu')
  })

  it('keeps the latest search result when requests finish out of order', async () => {
    let resolveFirst!: (pokemon: Awaited<ReturnType<typeof pokemonApi.fetchPokemonDetail>>) => void
    let resolveSecond!: (pokemon: Awaited<ReturnType<typeof pokemonApi.fetchPokemonDetail>>) => void
    mockedFetchPokemonPage.mockResolvedValue({
      page: 1,
      size: 20,
      totalCount: 0,
      totalPages: 0,
      items: [],
    })
    mockedFetchPokemonDetail
      .mockReturnValueOnce(new Promise((resolve) => { resolveFirst = resolve }))
      .mockReturnValueOnce(new Promise((resolve) => { resolveSecond = resolve }))

    const wrapper = mount(App)
    await flush()
    const searchInput = wrapper.get('input[aria-label="Search Pokémon"]')
    const searchForm = wrapper.get('form')

    await searchInput.setValue('pikachu')
    await searchForm.trigger('submit')
    await searchInput.setValue('bulbasaur')
    await searchForm.trigger('submit')

    resolveSecond({
      id: 1,
      name: 'bulbasaur',
      types: ['grass', 'poison'],
      abilities: ['overgrow'],
      stats: [],
      spriteUrl: 'bulbasaur-sprite',
    })
    await flush()

    expect(wrapper.text()).toContain('#1 bulbasaur')

    resolveFirst({
      id: 25,
      name: 'pikachu',
      types: ['electric'],
      abilities: ['static'],
      stats: [],
      spriteUrl: 'pikachu-sprite',
    })
    await flush()

    expect(wrapper.text()).toContain('#1 bulbasaur')
    expect(wrapper.text()).not.toContain('#25 pikachu')
  })

  it('shows a validation message when search is submitted empty', async () => {
    mockedFetchPokemonPage.mockResolvedValue({
      page: 1,
      size: 20,
      totalCount: 0,
      totalPages: 0,
      items: [],
    })

    const wrapper = mount(App)
    await flush()
    await wrapper.get('form').trigger('submit')

    expect(wrapper.text()).toContain('Enter a Pokémon name or ID.')
    expect(mockedFetchPokemonDetail).not.toHaveBeenCalled()
  })

  it('searches after the debounce delay when the query changes', async () => {
    vi.useFakeTimers()
    mockedFetchPokemonPage.mockResolvedValue({
      page: 1,
      size: 20,
      totalCount: 0,
      totalPages: 0,
      items: [],
    })
    mockedFetchPokemonDetail.mockResolvedValue({
      id: 25,
      name: 'pikachu',
      types: ['electric'],
      abilities: ['static'],
      stats: [],
      spriteUrl: 'sprite',
    })

    const wrapper = mount(App)
    await flush()
    await wrapper.get('input[aria-label="Search Pokémon"]').setValue('pikachu')
    await vi.advanceTimersByTimeAsync(349)

    expect(mockedFetchPokemonDetail).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    await flush()

    expect(mockedFetchPokemonDetail).toHaveBeenCalledWith('pikachu')
    expect(wrapper.text()).toContain('#25 pikachu')
  })

  it('requests the next and previous pages from the pager', async () => {
    mockedFetchPokemonPage
      .mockResolvedValueOnce({
        page: 1,
        size: 20,
        totalCount: 21,
        totalPages: 2,
        items: [],
      })
      .mockResolvedValueOnce({
        page: 2,
        size: 20,
        totalCount: 21,
        totalPages: 2,
        items: [],
      })
      .mockResolvedValueOnce({
        page: 1,
        size: 20,
        totalCount: 21,
        totalPages: 2,
        items: [],
      })

    const wrapper = mount(App)
    await flush()
    await wrapper.get('.pager button:last-child').trigger('click')
    await flush()
    expect(mockedFetchPokemonPage).toHaveBeenNthCalledWith(2, 2, 20)
    expect(wrapper.text()).toContain('Page 2 of 2')

    await wrapper.get('.pager button:first-child').trigger('click')
    await flush()
    expect(mockedFetchPokemonPage).toHaveBeenNthCalledWith(3, 1, 20)
    expect(wrapper.text()).toContain('Page 1 of 2')
  })

  it('disables pagination controls at page boundaries and while loading', async () => {
    mockedFetchPokemonPage.mockResolvedValue({
      page: 1,
      size: 20,
      totalCount: 21,
      totalPages: 2,
      items: [],
    })

    const wrapper = mount(App)
    await flush()
    expect((wrapper.get('.pager button:first-child').element as HTMLButtonElement).disabled).toBe(true)
    expect((wrapper.get('.pager button:last-child').element as HTMLButtonElement).disabled).toBe(false)

    mockedFetchPokemonPage.mockReturnValue(new Promise(() => {}))
    await wrapper.get('.pager button:last-child').trigger('click')
    await wrapper.vm.$nextTick()

    expect((wrapper.get('.pager button:first-child').element as HTMLButtonElement).disabled).toBe(true)
    expect((wrapper.get('.pager button:last-child').element as HTMLButtonElement).disabled).toBe(true)
  })

  it('disables the next control on the last page', async () => {
    mockedFetchPokemonPage.mockResolvedValue({
      page: 2,
      size: 20,
      totalCount: 21,
      totalPages: 2,
      items: [],
    })

    const wrapper = mount(App)
    await flush()

    expect((wrapper.get('.pager button:first-child').element as HTMLButtonElement).disabled).toBe(false)
    expect((wrapper.get('.pager button:last-child').element as HTMLButtonElement).disabled).toBe(true)
  })

  it('filters Pokémon names case-insensitively and shows an empty match state', async () => {
    mockedFetchPokemonPage.mockResolvedValue({
      page: 1,
      size: 20,
      totalCount: 2,
      totalPages: 1,
      items: [
        { id: 1, name: 'bulbasaur', spriteUrl: 'sprite-1' },
        { id: 25, name: 'pikachu', spriteUrl: 'sprite-25' },
      ],
    })

    const wrapper = mount(App)
    await flush()
    const filterInput = wrapper.get('input[aria-label="Filter Pokémon list"]')
    await filterInput.setValue('PIKA')

    expect(wrapper.findAll('.list .item').map((button) => button.text())).toEqual(['#25 pikachu'])

    await filterInput.setValue('missing')

    expect(wrapper.text()).toContain('No Pokémon match current filter.')
    expect(wrapper.findAll('.list .item')).toHaveLength(0)
  })

  it('sorts Pokémon by ID and name in both directions', async () => {
    mockedFetchPokemonPage.mockResolvedValue({
      page: 1,
      size: 20,
      totalCount: 3,
      totalPages: 1,
      items: [
        { id: 25, name: 'pikachu', spriteUrl: 'sprite-25' },
        { id: 1, name: 'bulbasaur', spriteUrl: 'sprite-1' },
        { id: 4, name: 'charmander', spriteUrl: 'sprite-4' },
      ],
    })

    const wrapper = mount(App)
    await flush()
    const sortSelect = wrapper.get('select[aria-label="Sort Pokémon list"]')
    const expectedOrders = [
      ['id-asc', ['#1 bulbasaur', '#4 charmander', '#25 pikachu']],
      ['id-desc', ['#25 pikachu', '#4 charmander', '#1 bulbasaur']],
      ['name-asc', ['#1 bulbasaur', '#4 charmander', '#25 pikachu']],
      ['name-desc', ['#25 pikachu', '#4 charmander', '#1 bulbasaur']],
    ] as const

    for (const [sort, expected] of expectedOrders) {
      await sortSelect.setValue(sort)
      expect(wrapper.findAll('.list .item').map((button) => button.text())).toEqual(expected)
    }
  })
})

async function flush(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
}

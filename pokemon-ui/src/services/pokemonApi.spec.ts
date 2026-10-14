import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchPokemonDetail, fetchPokemonPage } from '@/services/pokemonApi'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('pokemonApi', () => {
  it('requests a page with the requested pagination parameters', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({
        page: 2,
        size: 10,
        totalCount: 20,
        totalPages: 2,
        items: [],
      }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchPokemonPage(2, 10)

    expect(fetchMock).toHaveBeenCalledWith('/api/pokemon?page=2&size=10')
    expect(result.page).toBe(2)
    expect(result.size).toBe(10)
  })

  it('includes a catalog search term in the paginated request', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({
        page: 1,
        size: 20,
        totalCount: 1,
        totalPages: 1,
        items: [],
      }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await fetchPokemonPage(1, 20, ' Mr Mime ')

    expect(fetchMock).toHaveBeenCalledWith('/api/pokemon?page=1&size=20&search=Mr+Mime')
  })

  it('encodes the Pokémon identifier in the detail request', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({
        id: 25,
        name: 'pikachu',
        types: ['electric'],
        abilities: ['static'],
        stats: [],
        spriteUrl: 'sprite',
      }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchPokemonDetail('Mr Mime/1')

    expect(fetchMock).toHaveBeenCalledWith('/api/pokemon/Mr%20Mime%2F1')
    expect(result.name).toBe('pikachu')
  })

  it('uses the API error message when a request fails', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ error: 'Pokémon not found.' }), { status: 404 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchPokemonDetail('missingno')).rejects.toThrow('Pokémon not found.')
  })

  it('uses a fallback error message when a failed response has no JSON error', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('Unavailable', { status: 503 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchPokemonPage(1, 20)).rejects.toThrow('Request failed.')
  })
})

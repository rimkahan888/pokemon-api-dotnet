import type { PokemonDetail, PokemonPage } from '@/types/pokemon'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

async function readJsonOrThrow<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = 'Request failed.'

    try {
      const payload = await response.json()
      if (payload?.error) {
        message = payload.error
      }
    } catch {
      // Ignore parse failure.
    }

    throw new Error(message)
  }

  return await response.json() as T
}

export async function fetchPokemonPage(page: number, size: number, search = ''): Promise<PokemonPage> {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (search.trim()) {
    params.set('search', search.trim())
  }

  const response = await fetch(`${API_BASE}/pokemon?${params}`)
  return readJsonOrThrow<PokemonPage>(response)
}

export async function fetchPokemonDetail(nameOrId: string): Promise<PokemonDetail> {
  const response = await fetch(`${API_BASE}/pokemon/${encodeURIComponent(nameOrId)}`)
  return readJsonOrThrow<PokemonDetail>(response)
}

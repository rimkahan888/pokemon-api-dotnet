import type { PokemonDetail, PokemonSummary } from '@/types/pokemon'

const FAVORITE_IDS_KEY = 'pokemon-favorite-ids'
const FAVORITE_METADATA_KEY = 'pokemon-favorite-metadata'
const TEAM_KEY = 'pokemon-team'

export function loadFavoriteIds(): number[] {
  try {
    const raw = localStorage.getItem(FAVORITE_IDS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return [...new Set(parsed.filter(isPositiveId))]
  } catch {
    return []
  }
}

export function saveFavoriteIds(ids: number[]): void {
  try {
    const unique = [...new Set(ids.filter(isPositiveId))]
    localStorage.setItem(FAVORITE_IDS_KEY, JSON.stringify(unique))
  } catch {
    // Keep the session usable when storage is unavailable.
  }
}

export function loadFavoriteMetadata(): PokemonSummary[] {
  try {
    const raw = localStorage.getItem(FAVORITE_METADATA_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    const valid = parsed.filter((item): item is PokemonSummary =>
      isRecord(item)
      && isPositiveId(item.id)
      && typeof item.name === 'string'
      && typeof item.spriteUrl === 'string',
    )

    return uniqueById(valid)
  } catch {
    return []
  }
}

export function saveFavoriteMetadata(metadata: PokemonSummary[]): void {
  try {
    const valid = metadata.filter((item) =>
      isPositiveId(item.id)
      && typeof item.name === 'string'
      && typeof item.spriteUrl === 'string',
    )
    const unique = uniqueById(valid)
    localStorage.setItem(FAVORITE_METADATA_KEY, JSON.stringify(unique))
  } catch {
    // Keep the session usable when storage is unavailable.
  }
}

function isRecord(item: unknown): item is Record<string, unknown> {
  return typeof item === 'object' && item !== null
}

function uniqueById<T extends { id: number }>(items: T[]): T[] {
  const seen = new Set<number>()
  const unique: T[] = []
  for (const item of items) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    unique.push(item)
  }
  return unique
}

function isPositiveId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

function isTeamMember(item: unknown): item is PokemonDetail {
  if (!isRecord(item) || !isPositiveId(item.id)) return false
  return typeof item.name === 'string'
    && Array.isArray(item.types)
    && item.types.every((type) => typeof type === 'string')
    && Array.isArray(item.abilities)
    && Array.isArray(item.stats)
    && typeof item.spriteUrl === 'string'
}

export function loadTeam(): PokemonDetail[] {
  try {
    const raw = localStorage.getItem(TEAM_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return uniqueById(parsed.filter(isTeamMember)).slice(0, 6)
  } catch {
    return []
  }
}

export function saveTeam(team: PokemonDetail[]): void {
  try {
    const unique = uniqueById(team.filter(isTeamMember)).slice(0, 6)
    localStorage.setItem(TEAM_KEY, JSON.stringify(unique))
  } catch {
    // Keep the session usable when storage is unavailable.
  }
}

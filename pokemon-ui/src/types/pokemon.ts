export interface PokemonStat {
  name: string
  value: number
}

export interface PokemonDetail {
  id: number
  name: string
  types: string[]
  abilities: string[]
  stats: PokemonStat[]
  spriteUrl: string
  heightDecimeters?: number
  weightHectograms?: number
}

export interface PokemonSummary {
  id: number
  name: string
  spriteUrl: string
}

export interface PokemonPage {
  page: number
  size: number
  totalCount: number
  totalPages: number
  items: PokemonSummary[]
}

export type SortOption = 'id-asc' | 'id-desc' | 'name-asc' | 'name-desc'

export interface SharedWeakness {
  type: string
  count: number
  pokemonNames: string[]
}

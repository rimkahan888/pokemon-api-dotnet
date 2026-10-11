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

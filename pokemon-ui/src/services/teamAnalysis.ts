import type { PokemonDetail, SharedWeakness } from '@/types/pokemon'

export interface TeamAnalysis {
  coverage: PokemonType[]
  sharedWeaknesses: { type: PokemonType; pokemonNames: string[] }[]
}

export const POKEMON_TYPES = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy'
] as const

export type PokemonType = (typeof POKEMON_TYPES)[number]

interface DefenseMatchup {
  weak: PokemonType[]
  resist: PokemonType[]
  immune: PokemonType[]
}

export const DEFENSIVE_CHART: Record<PokemonType, DefenseMatchup> = {
  normal: {
    weak: ['fighting'],
    resist: [],
    immune: ['ghost']
  },
  fire: {
    weak: ['water', 'ground', 'rock'],
    resist: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'],
    immune: []
  },
  water: {
    weak: ['electric', 'grass'],
    resist: ['fire', 'water', 'ice', 'steel'],
    immune: []
  },
  electric: {
    weak: ['ground'],
    resist: ['electric', 'flying', 'steel'],
    immune: []
  },
  grass: {
    weak: ['fire', 'ice', 'poison', 'flying', 'bug'],
    resist: ['water', 'electric', 'grass', 'ground'],
    immune: []
  },
  ice: {
    weak: ['fire', 'fighting', 'rock', 'steel'],
    resist: ['ice'],
    immune: []
  },
  fighting: {
    weak: ['flying', 'psychic', 'fairy'],
    resist: ['bug', 'rock', 'dark'],
    immune: []
  },
  poison: {
    weak: ['ground', 'psychic'],
    resist: ['grass', 'fighting', 'poison', 'bug', 'fairy'],
    immune: []
  },
  ground: {
    weak: ['water', 'grass', 'ice'],
    resist: ['poison', 'rock'],
    immune: ['electric']
  },
  flying: {
    weak: ['electric', 'ice', 'rock'],
    resist: ['grass', 'fighting', 'bug'],
    immune: ['ground']
  },
  psychic: {
    weak: ['bug', 'ghost', 'dark'],
    resist: ['fighting', 'psychic'],
    immune: []
  },
  bug: {
    weak: ['fire', 'flying', 'rock'],
    resist: ['grass', 'fighting', 'ground'],
    immune: []
  },
  rock: {
    weak: ['water', 'grass', 'fighting', 'ground', 'steel'],
    resist: ['normal', 'fire', 'poison', 'flying'],
    immune: []
  },
  ghost: {
    weak: ['ghost', 'dark'],
    resist: ['poison', 'bug'],
    immune: ['normal', 'fighting']
  },
  dragon: {
    weak: ['ice', 'dragon', 'fairy'],
    resist: ['fire', 'water', 'electric', 'grass'],
    immune: []
  },
  dark: {
    weak: ['fighting', 'bug', 'fairy'],
    resist: ['ghost', 'dark'],
    immune: ['psychic']
  },
  steel: {
    weak: ['fire', 'fighting', 'ground'],
    resist: ['normal', 'grass', 'ice', 'flying', 'psychic', 'bug', 'rock', 'dragon', 'steel', 'fairy'],
    immune: ['poison']
  },
  fairy: {
    weak: ['poison', 'steel'],
    resist: ['fighting', 'bug', 'dark'],
    immune: ['dragon']
  }
}

/**
 * Normalizes a type string, filtering out any unrecognized string
 */
export function isValidType(type: string): type is PokemonType {
  return POKEMON_TYPES.includes(type.toLowerCase() as PokemonType)
}

/**
 * Calculates damage multiplier against a single Pokémon defender
 */
export function getDamageMultiplier(defendingTypes: string[], attackingType: PokemonType): number {
  const validDefending = defendingTypes
    .map(t => t.toLowerCase())
    .filter(isValidType)

  if (validDefending.length === 0) {
    return 1
  }

  let multiplier = 1

  for (const defType of validDefending) {
    const matchup = DEFENSIVE_CHART[defType]
    if (!matchup) continue

    if (matchup.immune.includes(attackingType)) {
      return 0 // Immunity negates all damage
    } else if (matchup.weak.includes(attackingType)) {
      multiplier *= 2
    } else if (matchup.resist.includes(attackingType)) {
      multiplier *= 0.5
    }
  }

  return multiplier
}

/**
 * Coverage is the unique team types, sorted in standard 18-type order
 */
export function getTeamCoverage(team: PokemonDetail[]): { coveredTypes: PokemonType[]; count: number } {
  const presentTypes = new Set<PokemonType>()

  for (const member of team) {
    if (!member.types) continue
    for (const t of member.types) {
      const lower = t.toLowerCase()
      if (isValidType(lower)) {
        presentTypes.add(lower)
      }
    }
  }

  const coveredTypes = POKEMON_TYPES.filter(type => presentTypes.has(type))
  return {
    coveredTypes,
    count: coveredTypes.length
  }
}

/**
 * A shared weakness is an attacking type whose damage multiplier is at least 2
 * for two or more team members.
 */
export function getSharedWeaknesses(team: PokemonDetail[]): SharedWeakness[] {
  if (!team || team.length < 2) {
    return []
  }

  const results: SharedWeakness[] = []

  for (const attackType of POKEMON_TYPES) {
    const vulnerableMembers: string[] = []

    for (const member of team) {
      const multiplier = getDamageMultiplier(member.types, attackType)
      if (multiplier >= 2) {
        vulnerableMembers.push(member.name)
      }
    }

    if (vulnerableMembers.length >= 2) {
      results.push({
        type: attackType,
        count: vulnerableMembers.length,
        pokemonNames: vulnerableMembers
      })
    }
  }

  return results
}

export function analyzeTeam(team: PokemonDetail[]): TeamAnalysis {
  return {
    coverage: getTeamCoverage(team).coveredTypes,
    sharedWeaknesses: getSharedWeaknesses(team).map((weakness) => ({
      type: weakness.type as PokemonType,
      pokemonNames: weakness.pokemonNames,
    })),
  }
}

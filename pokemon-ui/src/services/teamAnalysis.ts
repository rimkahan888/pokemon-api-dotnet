import type { PokemonDetail } from '@/types/pokemon'

export const pokemonTypes = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground',
  'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
] as const

export type PokemonType = typeof pokemonTypes[number]

interface DefensiveMatchups {
  weak: PokemonType[]
  resist: PokemonType[]
  immune: PokemonType[]
}

const defensiveMatchups: Record<PokemonType, DefensiveMatchups> = {
  normal: { weak: ['fighting'], resist: [], immune: ['ghost'] },
  fire: { weak: ['water', 'ground', 'rock'], resist: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'], immune: [] },
  water: { weak: ['electric', 'grass'], resist: ['fire', 'water', 'ice', 'steel'], immune: [] },
  electric: { weak: ['ground'], resist: ['electric', 'flying', 'steel'], immune: [] },
  grass: { weak: ['fire', 'ice', 'poison', 'flying', 'bug'], resist: ['water', 'electric', 'grass', 'ground'], immune: [] },
  ice: { weak: ['fire', 'fighting', 'rock', 'steel'], resist: ['ice'], immune: [] },
  fighting: { weak: ['flying', 'psychic', 'fairy'], resist: ['bug', 'rock', 'dark'], immune: [] },
  poison: { weak: ['ground', 'psychic'], resist: ['grass', 'fighting', 'poison', 'bug', 'fairy'], immune: [] },
  ground: { weak: ['water', 'grass', 'ice'], resist: ['poison', 'rock'], immune: ['electric'] },
  flying: { weak: ['electric', 'ice', 'rock'], resist: ['grass', 'fighting', 'bug'], immune: ['ground'] },
  psychic: { weak: ['bug', 'ghost', 'dark'], resist: ['fighting', 'psychic'], immune: [] },
  bug: { weak: ['fire', 'flying', 'rock'], resist: ['grass', 'fighting', 'ground'], immune: [] },
  rock: { weak: ['water', 'grass', 'fighting', 'ground', 'steel'], resist: ['normal', 'fire', 'poison', 'flying'], immune: [] },
  ghost: { weak: ['ghost', 'dark'], resist: ['poison', 'bug'], immune: ['normal', 'fighting'] },
  dragon: { weak: ['ice', 'dragon', 'fairy'], resist: ['fire', 'water', 'electric', 'grass'], immune: [] },
  dark: { weak: ['fighting', 'bug', 'fairy'], resist: ['ghost', 'dark'], immune: ['psychic'] },
  steel: { weak: ['fire', 'fighting', 'ground'], resist: ['normal', 'grass', 'ice', 'flying', 'psychic', 'bug', 'rock', 'dragon', 'steel', 'fairy'], immune: ['poison'] },
  fairy: { weak: ['poison', 'steel'], resist: ['fighting', 'bug', 'dark'], immune: ['dragon'] },
}

export interface SharedWeakness {
  type: PokemonType
  pokemonNames: string[]
}

export interface TeamAnalysis {
  coverage: PokemonType[]
  sharedWeaknesses: SharedWeakness[]
}

function isPokemonType(type: string): type is PokemonType {
  return pokemonTypes.includes(type as PokemonType)
}

function effectiveness(attackingType: PokemonType, defendingType: PokemonType): number {
  const matchup = defensiveMatchups[defendingType]
  if (matchup.immune.includes(attackingType)) return 0
  if (matchup.weak.includes(attackingType)) return 2
  if (matchup.resist.includes(attackingType)) return 0.5
  return 1
}

export function analyzeTeam(team: PokemonDetail[]): TeamAnalysis {
  const coverage = [...new Set(team.flatMap((pokemon) =>
    pokemon.types.filter(isPokemonType),
  ))].sort((a, b) => pokemonTypes.indexOf(a) - pokemonTypes.indexOf(b))

  const sharedWeaknesses = pokemonTypes.flatMap((attackingType) => {
    const affectedNames = team
      .filter((pokemon) => {
        const types = pokemon.types.filter(isPokemonType)
        return types.reduce(
          (multiplier, defendingType) => multiplier * effectiveness(attackingType, defendingType),
          1,
        ) >= 2
      })
      .map((pokemon) => pokemon.name)

    return affectedNames.length >= 2
      ? [{ type: attackingType, pokemonNames: affectedNames }]
      : []
  })

  return { coverage, sharedWeaknesses }
}

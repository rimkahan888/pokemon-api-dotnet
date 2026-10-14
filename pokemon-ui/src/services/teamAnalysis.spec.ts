import { describe, expect, it } from 'vitest'
import { analyzeTeam } from '@/services/teamAnalysis'
import type { PokemonDetail } from '@/types/pokemon'

function pokemon(id: number, name: string, types: string[]): PokemonDetail {
  return { id, name, types, abilities: [], stats: [], spriteUrl: '' }
}

describe('analyzeTeam', () => {
  it('lists unique team types and identifies shared weaknesses across dual types', () => {
    const analysis = analyzeTeam([
      pokemon(6, 'charizard', ['fire', 'flying']),
      pokemon(130, 'gyarados', ['water', 'flying']),
    ])

    expect(analysis.coverage).toEqual(['fire', 'water', 'flying'])
    expect(analysis.sharedWeaknesses).toContainEqual({
      type: 'electric',
      pokemonNames: ['charizard', 'gyarados'],
    })
    expect(analysis.sharedWeaknesses).toContainEqual({
      type: 'rock',
      pokemonNames: ['charizard', 'gyarados'],
    })
  })

  it('accounts for immunity and resistance when combining dual-type matchups', () => {
    const analysis = analyzeTeam([
      pokemon(6, 'charizard', ['fire', 'flying']),
      pokemon(3, 'venusaur', ['grass', 'poison']),
      pokemon(130, 'gyarados', ['water', 'flying']),
    ])

    expect(analysis.sharedWeaknesses.find((weakness) => weakness.type === 'ground')).toBeUndefined()
    expect(analysis.sharedWeaknesses.find((weakness) => weakness.type === 'electric')?.pokemonNames)
      .toEqual(['charizard', 'gyarados'])
  })

  it('returns no coverage or shared weaknesses for an empty team', () => {
    expect(analyzeTeam([])).toEqual({ coverage: [], sharedWeaknesses: [] })
  })
})

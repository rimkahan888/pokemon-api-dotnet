import { describe, it, expect } from 'vitest'
import {
  getDamageMultiplier,
  getTeamCoverage,
  getSharedWeaknesses,
} from '@/services/teamAnalysis'
import type { PokemonDetail } from '@/types/pokemon'

describe('teamAnalysis', () => {
  describe('getDamageMultiplier', () => {
    it('calculates single-type weakness and resistance correctly', () => {
      // Fire defender is weak to Water (2x) and resists Grass (0.5x)
      expect(getDamageMultiplier(['fire'], 'water')).toBe(2)
      expect(getDamageMultiplier(['fire'], 'grass')).toBe(0.5)
      expect(getDamageMultiplier(['fire'], 'electric')).toBe(1)
    })

    it('calculates immunity correctly (multiplier 0)', () => {
      // Normal defender is immune to Ghost
      expect(getDamageMultiplier(['normal'], 'ghost')).toBe(0)
      // Flying defender is immune to Ground
      expect(getDamageMultiplier(['flying'], 'ground')).toBe(0)
    })

    it('handles dual-type multiplication correctly (example from brief: Fire/Flying vs Ground)', () => {
      // Fire is weak to Ground (2x), but Flying is immune to Ground (0x) -> 0x
      expect(getDamageMultiplier(['fire', 'flying'], 'ground')).toBe(0)

      // Dual type 4x weakness (e.g., Grass/Poison defender vs Psychic)
      // Grass: neutral to Psychic (1x), Poison: weak to Psychic (2x) -> 2x
      expect(getDamageMultiplier(['grass', 'poison'], 'psychic')).toBe(2)

      // Grass/Bug defender vs Fire: Grass weak (2x) * Bug weak (2x) = 4x
      expect(getDamageMultiplier(['grass', 'bug'], 'fire')).toBe(4)
    })

    it('ignores invalid or unknown types', () => {
      expect(getDamageMultiplier(['unknown_type', 'fire'], 'water')).toBe(2)
    })
  })

  describe('getTeamCoverage', () => {
    it('returns 0 covered types for an empty team', () => {
      const coverage = getTeamCoverage([])
      expect(coverage.count).toBe(0)
      expect(coverage.coveredTypes).toEqual([])
    })

    it('returns unique types sorted in the canonical 18-type order', () => {
      const mockTeam: PokemonDetail[] = [
        {
          id: 1,
          name: 'bulbasaur',
          types: ['grass', 'poison'],
          abilities: ['overgrow'],
          stats: [{ name: 'hp', value: 45 }],
          spriteUrl: 'https://example.com/1.png'
        },
        {
          id: 4,
          name: 'charmander',
          types: ['fire'],
          abilities: ['blaze'],
          stats: [{ name: 'hp', value: 39 }],
          spriteUrl: 'https://example.com/4.png'
        }
      ]

      const coverage = getTeamCoverage(mockTeam)
      expect(coverage.count).toBe(3)
      // Order must match POKEMON_TYPES: fire, grass, poison
      expect(coverage.coveredTypes).toEqual(['fire', 'grass', 'poison'])
    })
  })

  describe('getSharedWeaknesses', () => {
    it('returns empty array if team has fewer than 2 members', () => {
      const mockTeam: PokemonDetail[] = [
        {
          id: 1,
          name: 'bulbasaur',
          types: ['grass', 'poison'],
          abilities: ['overgrow'],
          stats: [{ name: 'hp', value: 45 }],
          spriteUrl: 'https://example.com/1.png'
        }
      ]
      expect(getSharedWeaknesses(mockTeam)).toEqual([])
    })

    it('identifies an attacking type that hits 2 or more team members with >= 2x damage', () => {
      // Bulbasaur (grass/poison) is weak to Fire, Ice, Flying, Psychic
      // Oddish (grass/poison) is weak to Fire, Ice, Flying, Psychic
      const mockTeam: PokemonDetail[] = [
        {
          id: 1,
          name: 'bulbasaur',
          types: ['grass', 'poison'],
          abilities: ['overgrow'],
          stats: [],
          spriteUrl: ''
        },
        {
          id: 43,
          name: 'oddish',
          types: ['grass', 'poison'],
          abilities: ['chlorophyll'],
          stats: [],
          spriteUrl: ''
        }
      ]

      const weaknesses = getSharedWeaknesses(mockTeam)
      const fireWeakness = weaknesses.find(w => w.type === 'fire')
      expect(fireWeakness).toBeDefined()
      expect(fireWeakness?.count).toBe(2)
      expect(fireWeakness?.pokemonNames).toContain('bulbasaur')
      expect(fireWeakness?.pokemonNames).toContain('oddish')
    })
  })
})

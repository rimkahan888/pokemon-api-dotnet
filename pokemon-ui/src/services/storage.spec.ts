import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadFavoriteIds,
  saveFavoriteIds,
  loadFavoriteMetadata,
  saveFavoriteMetadata,
  loadTeam,
  saveTeam
} from '@/services/storage'
import type { PokemonDetail, PokemonSummary } from '@/types/pokemon'

describe('storage service', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('favorites', () => {
    it('returns empty array if storage is empty or corrupt', () => {
      expect(loadFavoriteIds()).toEqual([])
      localStorage.setItem('pokemon-favorite-ids', 'invalid-json')
      expect(loadFavoriteIds()).toEqual([])
    })

    it('saves and loads unique positive safe integers only', () => {
      saveFavoriteIds([1, 2, 2, -5, 0, 3])
      const loaded = loadFavoriteIds()
      expect(loaded).toEqual([1, 2, 3])
    })

    it('saves and loads favorite metadata cleanly', () => {
      const items: PokemonSummary[] = [
        { id: 1, name: 'bulbasaur', spriteUrl: 'https://example.com/1.png' },
        { id: 1, name: 'bulbasaur', spriteUrl: 'https://example.com/1.png' } // duplicate
      ]
      saveFavoriteMetadata(items)
      const loaded = loadFavoriteMetadata()
      expect(loaded).toHaveLength(1)
      expect(loaded[0]?.name).toBe('bulbasaur')
    })
  })

  describe('team', () => {
    it('enforces maximum 6 distinct pokemon members', () => {
      const team: PokemonDetail[] = []
      for (let i = 1; i <= 8; i++) {
        team.push({
          id: i,
          name: `poke-${i}`,
          types: ['normal'],
          abilities: ['run'],
          stats: [{ name: 'hp', value: 10 * i }],
          spriteUrl: `https://example.com/${i}.png`
        })
      }

      saveTeam(team)
      const loaded = loadTeam()
      expect(loaded).toHaveLength(6)
      expect(loaded.map(p => p.id)).toEqual([1, 2, 3, 4, 5, 6])
    })

    it('drops duplicates so first occurrence wins', () => {
      const team: PokemonDetail[] = [
        {
          id: 25,
          name: 'pikachu',
          types: ['electric'],
          abilities: ['static'],
          stats: [],
          spriteUrl: ''
        },
        {
          id: 25,
          name: 'pikachu-duplicate',
          types: ['electric'],
          abilities: ['static'],
          stats: [],
          spriteUrl: ''
        }
      ]

      saveTeam(team)
      const loaded = loadTeam()
      expect(loaded).toHaveLength(1)
      expect(loaded[0]?.name).toBe('pikachu')
    })
  })
})

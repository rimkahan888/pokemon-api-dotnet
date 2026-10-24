<script setup lang="ts">
import { AlertCircle, Check, Plus, RotateCcw, Sparkles, Star } from '@lucide/vue'
import type { PokemonDetail } from '@/types/pokemon'

const props = defineProps<{
  pokemon: PokemonDetail | null
  isLoading: boolean
  error: string
  isFavorite: boolean
  isOnTeam: boolean
  isTeamFull: boolean
}>()

const emit = defineEmits<{
  'toggle-favorite': [pokemon: PokemonDetail]
  'add-to-team': [pokemon: PokemonDetail]
  retry: []
}>()

function formatHeight(decimeters: number): string {
  return `${(decimeters / 10).toFixed(1)} m`
}

function formatWeight(hectograms: number): string {
  return `${(hectograms / 10).toFixed(1)} kg`
}
</script>

<template>
  <div class="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 sm:p-6 flex flex-col h-full shadow-lg">
    <div class="flex items-center justify-between pb-4 border-b border-zinc-800/80">
      <h2 class="text-lg font-semibold text-zinc-100 tracking-tight">Pokémon Details</h2>
      <span v-if="pokemon" class="text-xs font-mono text-zinc-400 tabular-nums">#{{ pokemon.id }}</span>
    </div>

    <div
      v-if="error"
      class="my-auto py-8 text-center flex flex-col items-center justify-center"
      role="alert"
    >
      <div class="w-12 h-12 rounded-2xl bg-rose-950/40 border border-rose-800/50 flex items-center justify-center text-rose-400 mb-3">
        <AlertCircle class="w-6 h-6" />
      </div>
      <p class="text-sm font-medium text-rose-300 max-w-xs">{{ error }}</p>
      <button
        type="button"
        class="mt-4 px-3.5 py-2 rounded-xl bg-rose-900/30 hover:bg-rose-900/60 border border-rose-700/50 text-rose-100 text-xs font-medium flex items-center gap-1.5 transition-colors"
        aria-label="Retry loading Pokémon details"
        @click="emit('retry')"
      >
        <RotateCcw class="w-3.5 h-3.5" />
        <span>Try again</span>
      </button>
    </div>

    <div
      v-else-if="isLoading"
      class="py-8 flex flex-col items-center justify-center flex-1 space-y-6"
      aria-busy="true"
    >
      <p class="text-sm text-zinc-400" aria-live="polite">Loading details...</p>
      <div class="w-36 h-36 rounded-2xl bg-zinc-950/60 border border-zinc-800/50 animate-pulse"></div>
      <div class="w-40 h-6 bg-zinc-800/50 rounded animate-pulse"></div>
    </div>

    <div
      v-else-if="!pokemon"
      class="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center text-zinc-400"
    >
      <div class="w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3.5">
        <Sparkles class="w-6 h-6" />
      </div>
      <p class="text-sm font-medium text-zinc-300">Pick a Pokémon from the list or use search.</p>
    </div>

    <div v-else class="flex-1 flex flex-col pt-4 overflow-y-auto">
      <div class="flex flex-col items-center justify-center py-4 bg-zinc-950/50 border border-zinc-800/50 rounded-2xl">
        <img
          :src="pokemon.spriteUrl"
          :alt="`${pokemon.name} front sprite`"
          class="w-36 h-36 object-contain image-rendering-pixelated"
        />
        <h3 class="text-center mt-1 text-xl font-bold tracking-tight text-zinc-100">
          <span class="text-sm font-mono font-normal text-zinc-500 tabular-nums">#{{ pokemon.id }}</span><span class="capitalize">{{ ` ${pokemon.name}` }}</span>
        </h3>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
        <button
          type="button"
          class="px-4 py-2.5 rounded-xl border font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
          :class="isFavorite
            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
            : 'bg-zinc-950 border-zinc-800 text-zinc-200 hover:text-amber-400 hover:border-amber-500/40'"
          :aria-pressed="isFavorite"
          :aria-label="isFavorite ? 'Remove from favorites' : 'Add to favorites'"
          @click="emit('toggle-favorite', pokemon)"
        >
          <Star class="w-4 h-4" :class="{ 'fill-amber-400 text-amber-400': isFavorite }" />
          <span>{{ isFavorite ? 'In favorites' : 'Add to favorites' }}</span>
        </button>

        <button
          type="button"
          class="px-4 py-2.5 rounded-xl border font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :class="isOnTeam
            ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
            : 'bg-zinc-950 border-zinc-800 text-zinc-200 hover:text-amber-400 hover:border-amber-500/40'"
          :disabled="isOnTeam || isTeamFull"
          :aria-label="isOnTeam
            ? `${pokemon.name} is on team`
            : isTeamFull
              ? 'Team roster is full (max 6)'
              : `Add ${pokemon.name} to team`"
          @click="emit('add-to-team', pokemon)"
        >
          <Check v-if="isOnTeam" class="w-4 h-4 text-emerald-400" />
          <Plus v-else class="w-4 h-4" />
          <span>{{ isOnTeam ? 'On team' : isTeamFull ? 'Team full' : 'Add to team' }}</span>
        </button>
      </div>

      <div class="mt-5 pt-4 border-t border-zinc-800/70 space-y-3 text-sm">
        <p><span class="text-xs font-semibold uppercase tracking-wider text-zinc-400">Types:</span> <span class="text-zinc-200 capitalize">{{ pokemon.types.join(', ') }}</span></p>
        <p><span class="text-xs font-semibold uppercase tracking-wider text-zinc-400">Abilities:</span> <span class="text-zinc-200 capitalize">{{ pokemon.abilities.join(', ') }}</span></p>
        <p v-if="pokemon.heightDecimeters != null"><span class="text-xs font-semibold uppercase tracking-wider text-zinc-400">Height:</span> <span class="text-zinc-200">{{ formatHeight(pokemon.heightDecimeters) }}</span></p>
        <p v-if="pokemon.weightHectograms != null"><span class="text-xs font-semibold uppercase tracking-wider text-zinc-400">Weight:</span> <span class="text-zinc-200">{{ formatWeight(pokemon.weightHectograms) }}</span></p>
      </div>

      <div class="mt-5 pt-4 border-t border-zinc-800/70">
        <h4 class="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">Base Stats</h4>
        <ul v-if="pokemon.stats.length > 0" class="space-y-2.5">
          <li v-for="stat in pokemon.stats" :key="stat.name" class="flex items-center gap-3 text-xs">
            <span class="w-28 text-zinc-400 capitalize truncate">{{ stat.name.replace('-', ' ') }}: {{ stat.value }}</span>
            <meter
              class="stat-meter flex-1"
              min="0"
              max="255"
              :value="stat.value"
              :aria-label="`${stat.name} base stat`"
            ></meter>
          </li>
        </ul>
        <p v-else class="text-xs text-zinc-500">No base stats reported.</p>
      </div>
    </div>
  </div>
</template>

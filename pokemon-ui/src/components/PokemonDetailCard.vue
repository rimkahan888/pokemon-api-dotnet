<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { AlertCircle, Check, Plus, RotateCcw, Sparkles, Star } from '@lucide/vue'
import { readPrefersReducedMotion } from '@/ambient/scene'
import type { PokemonDetail, PokemonStat } from '@/types/pokemon'

const TYPE_GLOW: Record<string, string> = {
  normal: '#a8a77a',
  fire: '#ee8130',
  water: '#6390f0',
  electric: '#f7d02c',
  grass: '#7ac74c',
  ice: '#96d9d6',
  fighting: '#c22e28',
  poison: '#a33ea1',
  ground: '#e2bf65',
  flying: '#a98ff3',
  psychic: '#f95587',
  bug: '#a6b91a',
  rock: '#b6a136',
  ghost: '#735797',
  dragon: '#6f35fc',
  dark: '#705746',
  steel: '#b7b7ce',
  fairy: '#d685ad',
}

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

const displayedStats = ref<number[]>([])
const popTarget = ref<'favorite' | 'team' | null>(null)
let statFrame = 0

const glowColor = computed(() => TYPE_GLOW[props.pokemon?.types[0] ?? ''] ?? '#fbbf24')
const glowColorSecondary = computed(() => TYPE_GLOW[props.pokemon?.types[1] ?? ''] ?? glowColor.value)

function cancelStatFill(): void {
  if (typeof cancelAnimationFrame === 'function' && statFrame) {
    cancelAnimationFrame(statFrame)
  }
  statFrame = 0
}

function animateStats(stats: PokemonStat[]): void {
  cancelStatFill()
  const targets = stats.map((stat) => stat.value)
  if (targets.length === 0 || readPrefersReducedMotion() || typeof requestAnimationFrame !== 'function') {
    displayedStats.value = targets
    return
  }

  displayedStats.value = targets.map(() => 0)
  const started = performance.now()
  const duration = 720
  const tick = (now: number) => {
    const progress = Math.min(1, (now - started) / duration)
    const eased = 1 - (1 - progress) ** 3
    displayedStats.value = targets.map((value) => value * eased)
    if (progress < 1) statFrame = requestAnimationFrame(tick)
  }
  statFrame = requestAnimationFrame(tick)
}

function displayedStat(index: number, fallback: number): number {
  return displayedStats.value[index] ?? fallback
}

function pulse(target: 'favorite' | 'team'): void {
  if (readPrefersReducedMotion()) return
  popTarget.value = null
  const frame = globalThis.requestAnimationFrame
  const apply = () => {
    popTarget.value = target
  }
  if (typeof frame === 'function') frame(apply)
  else apply()
}

function onToggleFavorite(pokemon: PokemonDetail): void {
  emit('toggle-favorite', pokemon)
  pulse('favorite')
}

function onAddToTeam(pokemon: PokemonDetail): void {
  emit('add-to-team', pokemon)
  pulse('team')
}

watch(() => props.pokemon, (pokemon) => {
  animateStats(pokemon?.stats ?? [])
}, { immediate: true })

onUnmounted(cancelStatFill)
</script>

<template>
  <div class="glass-panel panel-enter panel-enter-2 rounded-2xl p-4 sm:p-6 flex flex-col h-full">
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

    <div v-else :key="pokemon.id" class="detail-enter flex-1 flex flex-col pt-4 overflow-y-auto">
      <div
        class="type-glow flex flex-col items-center justify-center py-4 rounded-2xl glass-inset"
        :style="{ '--type-glow': glowColor, '--type-glow-2': glowColorSecondary }"
      >
        <img
          :src="pokemon.spriteUrl"
          :alt="`${pokemon.name} front sprite`"
          class="sprite-bob w-36 h-36 object-contain image-rendering-pixelated"
        />
        <h3 class="text-center mt-1 text-xl font-bold tracking-tight text-zinc-100">
          <span class="text-sm font-mono font-normal text-zinc-500 tabular-nums">#{{ pokemon.id }}</span><span class="capitalize">{{ ` ${pokemon.name}` }}</span>
        </h3>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
        <button
          type="button"
          class="px-4 py-2.5 rounded-xl border font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
          :class="[
            isFavorite
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              : 'bg-black/30 border-white/10 text-zinc-200 hover:text-amber-400 hover:border-amber-500/40',
            { 'star-pop': popTarget === 'favorite' },
          ]"
          :aria-pressed="isFavorite"
          :aria-label="isFavorite ? 'Remove from favorites' : 'Add to favorites'"
          @click="onToggleFavorite(pokemon)"
        >
          <Star class="w-4 h-4" :class="{ 'fill-amber-400 text-amber-400': isFavorite }" />
          <span>{{ isFavorite ? 'In favorites' : 'Add to favorites' }}</span>
        </button>

        <button
          type="button"
          class="px-4 py-2.5 rounded-xl border font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :class="[
            isOnTeam
              ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
              : 'bg-black/30 border-white/10 text-zinc-200 hover:text-amber-400 hover:border-amber-500/40',
            { 'team-pop': popTarget === 'team' },
          ]"
          :disabled="isOnTeam || isTeamFull"
          :aria-label="isOnTeam
            ? `${pokemon.name} is on team`
            : isTeamFull
              ? 'Team roster is full (max 6)'
              : `Add ${pokemon.name} to team`"
          @click="onAddToTeam(pokemon)"
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
          <li v-for="(stat, index) in pokemon.stats" :key="stat.name" class="flex items-center gap-3 text-xs">
            <span class="w-28 text-zinc-400 capitalize truncate">{{ stat.name.replace('-', ' ') }}: {{ stat.value }}</span>
            <meter
              class="stat-meter flex-1"
              min="0"
              max="255"
              :value="displayedStat(index, stat.value)"
              :aria-label="`${stat.name} base stat`"
            ></meter>
          </li>
        </ul>
        <p v-else class="text-xs text-zinc-500">No base stats reported.</p>
      </div>
    </div>
  </div>
</template>

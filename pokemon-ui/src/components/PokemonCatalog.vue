<script setup lang="ts">
import { computed, ref } from 'vue'
import { readPrefersReducedMotion } from '@/ambient/scene'
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Search,
  Star,
  X,
} from '@lucide/vue'
import type { PokemonSummary, SortOption } from '@/types/pokemon'

const props = defineProps<{
  activeTab: 'all' | 'favorites'
  items: PokemonSummary[]
  page: number
  totalPages: number
  totalCount: number
  isLoading: boolean
  error: string
  searchQuery: string
  sortOption: SortOption
  favoriteIds: number[]
  selectedPokemonId: number | null
}>()

const emit = defineEmits<{
  'update:activeTab': [tab: 'all' | 'favorites']
  'update:searchQuery': [query: string]
  'update:sortOption': [sort: SortOption]
  'change-page': [page: number]
  'select-pokemon': [pokemon: PokemonSummary]
  'toggle-favorite': [pokemon: PokemonSummary]
  retry: []
}>()

const sortedItems = computed(() => {
  const list = [...props.items]
  switch (props.sortOption) {
    case 'id-desc':
      return list.sort((a, b) => b.id - a.id)
    case 'name-asc':
      return list.sort((a, b) => a.name.localeCompare(b.name))
    case 'name-desc':
      return list.sort((a, b) => b.name.localeCompare(a.name))
    default:
      return list.sort((a, b) => a.id - b.id)
  }
})

function isFavorite(id: number): boolean {
  return props.favoriteIds.includes(id)
}

function viewLabel(pokemon: PokemonSummary): string {
  return pokemon.name
    ? `View Pokémon #${pokemon.id} ${pokemon.name}`
    : `View Pokémon #${pokemon.id}`
}

function favoriteLabel(pokemon: PokemonSummary, saved: boolean): string {
  const name = pokemon.name || `Pokémon #${pokemon.id}`
  return saved ? `Remove ${name} from favorites` : `Add ${name} to favorites`
}

const poppedFavoriteId = ref<number | null>(null)

function onToggleFavorite(pokemon: PokemonSummary): void {
  emit('toggle-favorite', pokemon)
  if (readPrefersReducedMotion()) return
  poppedFavoriteId.value = null
  const frame = globalThis.requestAnimationFrame
  if (typeof frame !== 'function') {
    poppedFavoriteId.value = pokemon.id
    return
  }
  frame(() => {
    poppedFavoriteId.value = pokemon.id
  })
}

const emptyMessage = computed(() => {
  const filtering = props.searchQuery.trim().length > 0
  const favoritesEmpty = props.activeTab === 'favorites' && props.favoriteIds.length === 0
  if (filtering && !favoritesEmpty) {
    return 'No Pokémon match current filter.'
  }
  if (props.activeTab === 'favorites') {
    return 'No favorites yet.'
  }
  return 'No Pokémon found.'
})
</script>

<template>
  <div class="glass-panel panel-enter rounded-2xl p-4 sm:p-5 flex flex-col h-full">
    <div class="flex items-center justify-between pb-4 border-b border-zinc-800/80 gap-3">
      <div>
        <h2 class="text-lg font-semibold text-zinc-100 tracking-tight">
          {{ activeTab === 'all' ? 'Pokémon List' : 'Favorites' }}
        </h2>
        <p class="text-xs text-zinc-400 mt-0.5">
          <span class="tabular-nums font-mono text-zinc-300 font-semibold">{{ totalCount }}</span>
          {{ activeTab === 'all' ? 'total Pokémon in catalog' : 'saved Pokémon' }}
        </p>
      </div>

      <div class="viewTabs inline-flex p-1 bg-zinc-950 border border-zinc-800 rounded-xl" role="tablist" aria-label="Pokémon collection">
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'all'"
          class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
          :class="activeTab === 'all' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold' : 'text-zinc-400 hover:text-zinc-200'"
          @click="emit('update:activeTab', 'all')"
        >
          All Pokémon
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'favorites'"
          class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
          :class="activeTab === 'favorites' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold' : 'text-zinc-400 hover:text-zinc-200'"
          @click="emit('update:activeTab', 'favorites')"
        >
          <span>Favorites</span>
          <span
            v-if="favoriteIds.length > 0"
            class="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-amber-400 tabular-nums"
          >
            {{ favoriteIds.length }}
          </span>
        </button>
      </div>
    </div>

    <div class="pt-4 pb-3 flex flex-col sm:flex-row gap-2.5">
      <div class="relative flex-1">
        <label for="catalog-search" class="sr-only">Search full catalog by name or ID</label>
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
          <Search class="w-4 h-4" />
        </div>
        <input
          id="catalog-search"
          type="text"
          :value="searchQuery"
          placeholder="Search full catalog by name or ID"
          maxlength="100"
          class="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
          aria-label="Search Pokémon catalog"
          @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        />
        <button
          v-if="searchQuery"
          type="button"
          class="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-200"
          aria-label="Clear search input"
          @click="emit('update:searchQuery', '')"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="w-full sm:w-44 shrink-0">
        <label for="catalog-sort" class="sr-only">Sort Pokémon list</label>
        <select
          id="catalog-sort"
          :value="sortOption"
          class="w-full py-2 px-3 text-xs sm:text-sm bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors cursor-pointer"
          aria-label="Sort Pokémon list"
          @change="emit('update:sortOption', ($event.target as HTMLSelectElement).value as SortOption)"
        >
          <option value="id-asc">ID (Ascending)</option>
          <option value="id-desc">ID (Descending)</option>
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
        </select>
      </div>
    </div>

    <div
      v-if="error"
      class="my-4 p-4 rounded-xl bg-rose-950/30 border border-rose-800/50 text-rose-200 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
      role="alert"
    >
      <div class="flex items-center gap-2.5">
        <AlertCircle class="w-5 h-5 text-rose-400 shrink-0" />
        <span>{{ error }}</span>
      </div>
      <button
        type="button"
        class="px-3 py-1.5 rounded-lg bg-rose-900/40 hover:bg-rose-900/70 border border-rose-700/50 text-rose-100 text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
        aria-label="Retry loading the Pokémon list"
        @click="emit('retry')"
      >
        <RotateCcw class="w-3.5 h-3.5" />
        <span>Try again</span>
      </button>
    </div>

    <div v-else-if="isLoading" class="py-2 space-y-2 flex-1" aria-busy="true">
      <p class="text-sm text-zinc-400" aria-live="polite">Loading list...</p>
      <div
        v-for="i in 6"
        :key="i"
        class="h-16 rounded-xl bg-zinc-950/50 border border-zinc-800/50 animate-pulse flex items-center px-4 gap-4"
      >
        <div class="w-10 h-10 rounded-lg bg-zinc-800/60 shrink-0"></div>
        <div class="flex-1 space-y-1.5">
          <div class="w-24 h-4 bg-zinc-800/60 rounded"></div>
          <div class="w-16 h-3 bg-zinc-800/40 rounded"></div>
        </div>
      </div>
    </div>

    <div
      v-else-if="sortedItems.length === 0"
      class="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center text-zinc-400"
    >
      <div class="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
        <Search v-if="activeTab === 'all'" class="w-6 h-6" />
        <Star v-else class="w-6 h-6" />
      </div>
      <p class="text-sm font-medium text-zinc-300">{{ emptyMessage }}</p>
    </div>

    <div v-else :key="activeTab" class="list flex-1 overflow-y-auto space-y-2 pr-1 py-1 min-h-[360px]" role="list">
      <div
        v-for="(pokemon, index) in sortedItems"
        :key="pokemon.id"
        class="catalog-row item group flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all duration-150 cursor-pointer focus:outline-none"
        :style="{ animationDelay: `${Math.min(index, 14) * 42}ms` }"
        :class="selectedPokemonId === pokemon.id
          ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-sm'
          : 'bg-black/25 hover:bg-white/[0.07] border-white/10 text-zinc-200 hover:border-amber-200/30 hover:shadow-[0_0_24px_rgba(255,186,80,0.14)]'"
        role="listitem"
        tabindex="0"
        :aria-selected="selectedPokemonId === pokemon.id"
        :aria-label="viewLabel(pokemon)"
        @click="emit('select-pokemon', pokemon)"
        @keydown.enter="emit('select-pokemon', pokemon)"
        @keydown.space.prevent="emit('select-pokemon', pokemon)"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-11 h-11 rounded-lg bg-zinc-900 border border-zinc-800/80 flex items-center justify-center shrink-0 overflow-hidden">
            <img
              v-if="pokemon.spriteUrl"
              :src="pokemon.spriteUrl"
              :alt="pokemon.name ? `${pokemon.name} sprite` : ''"
              loading="lazy"
              class="w-10 h-10 object-contain image-rendering-pixelated"
            />
          </div>
          <div class="truncate">
            <span class="text-xs font-mono text-zinc-500 tabular-nums">#{{ pokemon.id }}</span><span v-if="pokemon.name" class="text-sm font-semibold capitalize text-zinc-100 group-hover:text-amber-400 transition-colors">{{ ` ${pokemon.name}` }}</span>
          </div>
        </div>

        <button
          type="button"
          class="p-2 rounded-lg text-zinc-500 hover:text-amber-400 hover:bg-zinc-800/60 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
          :class="{ 'text-amber-400': isFavorite(pokemon.id), 'star-pop': poppedFavoriteId === pokemon.id }"
          :aria-pressed="isFavorite(pokemon.id)"
          :aria-label="favoriteLabel(pokemon, isFavorite(pokemon.id))"
          @click.stop="onToggleFavorite(pokemon)"
        >
          <Star
            class="w-4 h-4"
            :class="{ 'fill-amber-400 text-amber-400': isFavorite(pokemon.id) }"
          />
        </button>
      </div>
    </div>

    <div
      v-if="activeTab === 'all' && totalPages > 1"
      class="pager pt-4 border-t border-zinc-800/80 flex items-center justify-between mt-2"
    >
      <button
        type="button"
        class="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-amber-400 hover:border-amber-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 text-xs font-medium"
        aria-label="Previous page"
        :disabled="page <= 1 || isLoading"
        @click="emit('change-page', page - 1)"
      >
        <ChevronLeft class="w-4 h-4" />
        <span class="hidden sm:inline">Previous</span>
      </button>

      <div class="text-xs text-zinc-400 font-medium">
        Page <span class="text-zinc-200 tabular-nums font-mono">{{ page }}</span> of
        <span class="text-zinc-200 tabular-nums font-mono">{{ totalPages }}</span>
      </div>

      <button
        type="button"
        class="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-amber-400 hover:border-amber-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 text-xs font-medium"
        aria-label="Next page"
        :disabled="page >= totalPages || isLoading"
        @click="emit('change-page', page + 1)"
      >
        <span class="hidden sm:inline">Next</span>
        <ChevronRight class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

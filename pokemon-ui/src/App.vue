<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import AmbientBackground from '@/components/AmbientBackground.vue'
import HeaderNav from '@/components/HeaderNav.vue'
import PokemonCatalog from '@/components/PokemonCatalog.vue'
import PokemonDetailCard from '@/components/PokemonDetailCard.vue'
import PokemonTeam from '@/components/PokemonTeam.vue'
import { fetchPokemonDetail, fetchPokemonPage } from '@/services/pokemonApi'
import {
  loadFavoriteIds,
  loadFavoriteMetadata,
  loadTeam,
  saveFavoriteIds,
  saveFavoriteMetadata,
  saveTeam as persistTeam,
} from '@/services/storage'
import type { PokemonSummary } from '@/types/pokemon'

const pageSize = 20
const currentPage = ref(1)
const totalPages = ref(1)
const totalCount = ref(0)
const list = ref<PokemonSummary[]>([])
const selectedPokemon = ref<Awaited<ReturnType<typeof fetchPokemonDetail>> | null>(null)
const favoriteIds = ref(loadFavoriteIds())
const favoriteMetadata = ref(loadFavoriteMetadata().filter((pokemon) => favoriteIds.value.includes(pokemon.id)))
const team = ref(loadTeam())
const listLoading = ref(false)
const detailLoading = ref(false)
const listError = ref('')
const detailError = ref('')
const searchValidation = ref('')
const viewMode = ref<'all' | 'favorites'>('all')
const search = ref('')
const filterText = ref('')
const sortBy = ref<'id-asc' | 'id-desc' | 'name-asc' | 'name-desc'>('id-asc')
const listDebounceHandle = ref<ReturnType<typeof setTimeout> | null>(null)
const detailDebounceHandle = ref<ReturnType<typeof setTimeout> | null>(null)
const debounceDelayMs = 350
const suppressDebouncedSearch = ref(false)
let latestDetailRequest = 0
let latestListRequest = 0

const selectedPokemonIsFavorite = computed(() =>
  selectedPokemon.value !== null && favoriteIds.value.includes(selectedPokemon.value.id),
)
const selectedPokemonIsOnTeam = computed(() =>
  selectedPokemon.value !== null && team.value.some((pokemon) => pokemon.id === selectedPokemon.value?.id),
)
const activeList = computed<PokemonSummary[]>(() => {
  if (viewMode.value === 'all') {
    return list.value
  }

  return favoriteIds.value.map((id) => {
    const savedPokemon = favoriteMetadata.value.find((pokemon) => pokemon.id === id)
    if (savedPokemon) {
      return savedPokemon
    }

    const knownPokemon = list.value.find((pokemon) => pokemon.id === id)
    if (knownPokemon) {
      return knownPokemon
    }

    if (selectedPokemon.value?.id === id) {
      const { id: pokemonId, name, spriteUrl } = selectedPokemon.value
      return { id: pokemonId, name, spriteUrl }
    }

    return { id, name: '', spriteUrl: '' }
  })
})
const filteredAndSortedList = computed(() => {
  const normalizedFilter = filterText.value.trim().toLowerCase()
  let items = activeList.value

  if (normalizedFilter) {
    items = items.filter((pokemon) =>
      pokemon.name.toLowerCase().includes(normalizedFilter) || String(pokemon.id).includes(normalizedFilter),
    )
  }

  const sorted = [...items]
  switch (sortBy.value) {
    case 'id-desc':
      sorted.sort((a, b) => b.id - a.id)
      break
    case 'name-asc':
      sorted.sort((a, b) => a.name.localeCompare(b.name))
      break
    case 'name-desc':
      sorted.sort((a, b) => b.name.localeCompare(a.name))
      break
    default:
      sorted.sort((a, b) => a.id - b.id)
      break
  }

  return sorted
})

async function loadPage(page: number): Promise<void> {
  const requestId = ++latestListRequest
  listLoading.value = true
  listError.value = ''

  try {
    const payload = await fetchPokemonPage(page, pageSize, filterText.value.trim())
    if (requestId !== latestListRequest) return
    currentPage.value = payload.page
    totalPages.value = Math.max(payload.totalPages, 1)
    totalCount.value = payload.totalCount
    list.value = payload.items
    saveKnownFavoriteMetadata()
  } catch (error) {
    if (requestId !== latestListRequest) return
    listError.value = error instanceof Error ? error.message : 'Unable to load Pokémon list.'
    list.value = []
  } finally {
    if (requestId === latestListRequest) {
      listLoading.value = false
    }
  }
}

async function loadPokemon(nameOrId: string): Promise<void> {
  const requestId = ++latestDetailRequest
  detailLoading.value = true
  detailError.value = ''

  try {
    const pokemon = await fetchPokemonDetail(nameOrId)
    if (requestId === latestDetailRequest) {
      selectedPokemon.value = pokemon
    }
  } catch (error) {
    if (requestId === latestDetailRequest) {
      selectedPokemon.value = null
      detailError.value = error instanceof Error ? error.message : 'Unable to load Pokémon details.'
    }
  } finally {
    if (requestId === latestDetailRequest) {
      detailLoading.value = false
    }
  }
}

async function searchPokemon(): Promise<void> {
  const query = search.value.trim()
  if (!query) {
    searchValidation.value = 'Enter a Pokémon name or ID.'
    return
  }

  searchValidation.value = ''
  if (detailDebounceHandle.value) {
    clearTimeout(detailDebounceHandle.value)
    detailDebounceHandle.value = null
  }

  await loadPokemon(query)
}

async function viewPokemon(id: number): Promise<void> {
  suppressDebouncedSearch.value = true
  search.value = `${id}`
  searchValidation.value = ''
  try {
    await loadPokemon(`${id}`)
  } finally {
    suppressDebouncedSearch.value = false
  }
}

function toggleFavorite(pokemon: PokemonSummary): void {
  const isFavorite = favoriteIds.value.includes(pokemon.id)
  favoriteIds.value = isFavorite
    ? favoriteIds.value.filter((favoriteId) => favoriteId !== pokemon.id)
    : [...favoriteIds.value, pokemon.id]
  favoriteMetadata.value = isFavorite
    ? favoriteMetadata.value.filter((favorite) => favorite.id !== pokemon.id)
    : [...favoriteMetadata.value.filter((favorite) => favorite.id !== pokemon.id), {
        id: pokemon.id,
        name: pokemon.name,
        spriteUrl: pokemon.spriteUrl,
      }]

  saveFavoriteIds(favoriteIds.value)
  saveFavoriteMetadata(favoriteMetadata.value)
}

function saveKnownFavoriteMetadata(): void {
  const knownFavorites = list.value.filter((pokemon) => favoriteIds.value.includes(pokemon.id))
  if (knownFavorites.length === 0) return

  favoriteMetadata.value = [
    ...favoriteMetadata.value.filter((favorite) =>
      !knownFavorites.some((pokemon) => pokemon.id === favorite.id),
    ),
    ...knownFavorites,
  ]

  saveFavoriteMetadata(favoriteMetadata.value)
}

function addToTeam(): void {
  if (!selectedPokemon.value || selectedPokemonIsOnTeam.value || team.value.length >= 6) return

  team.value = [...team.value, selectedPokemon.value]
  persistTeam(team.value)
}

function removeFromTeam(id: number): void {
  team.value = team.value.filter((pokemon) => pokemon.id !== id)
  persistTeam(team.value)
}

function moveTeamMember(id: number, direction: -1 | 1): void {
  const index = team.value.findIndex((pokemon) => pokemon.id === id)
  const targetIndex = index + direction
  if (index < 0 || targetIndex < 0 || targetIndex >= team.value.length) return

  const reordered = [...team.value]
  const member = reordered[index]
  if (!member) return
  reordered.splice(index, 1)
  reordered.splice(targetIndex, 0, member)
  team.value = reordered
  persistTeam(team.value)
}

function moveTeamMemberByIndex(index: number, direction: -1 | 1): void {
  const member = team.value[index]
  if (!member) return
  moveTeamMember(member.id, direction)
}

function retryList(): void {
  void loadPage(currentPage.value || 1)
}

function retryDetail(): void {
  const query = search.value.trim()
  if (!query) return
  void loadPokemon(query)
}

function scrollToTeam(): void {
  const section = document.getElementById('team-section')
  if (!section) return
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
}

onMounted(async () => {
  await loadPage(1)
})

watch(filterText, () => {
  if (viewMode.value !== 'all') {
    return
  }

  if (listDebounceHandle.value) {
    clearTimeout(listDebounceHandle.value)
  }

  listDebounceHandle.value = setTimeout(() => {
    listDebounceHandle.value = null
    void loadPage(1)
  }, debounceDelayMs)
})

watch(viewMode, (mode) => {
  if (mode === 'all') {
    void loadPage(1)
  } else if (listDebounceHandle.value) {
    clearTimeout(listDebounceHandle.value)
    listDebounceHandle.value = null
  }
})

watch(search, (value) => {
  if (suppressDebouncedSearch.value) {
    return
  }

  const query = value.trim()
  detailError.value = ''
  searchValidation.value = ''

  if (detailDebounceHandle.value) {
    clearTimeout(detailDebounceHandle.value)
    detailDebounceHandle.value = null
  }

  if (!query) {
    return
  }

  detailDebounceHandle.value = setTimeout(() => {
    void loadPokemon(query)
  }, debounceDelayMs)
})

onUnmounted(() => {
  if (listDebounceHandle.value) {
    clearTimeout(listDebounceHandle.value)
  }
  if (detailDebounceHandle.value) {
    clearTimeout(detailDebounceHandle.value)
  }
})
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <AmbientBackground />
  <div class="relative z-10 min-h-screen">
    <HeaderNav
      v-model="search"
      :team-count="team.length"
      :validation-error="searchValidation"
      @submit="searchPokemon"
      @scroll-to-team="scrollToTeam"
    />

    <main id="main-content" class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-5">
        <div class="lg:col-span-3">
          <PokemonCatalog
            v-model:active-tab="viewMode"
            v-model:search-query="filterText"
            v-model:sort-option="sortBy"
            :items="filteredAndSortedList"
            :page="currentPage"
            :total-pages="totalPages"
            :total-count="viewMode === 'all' ? totalCount : favoriteIds.length"
            :is-loading="viewMode === 'all' && listLoading"
            :error="viewMode === 'all' ? listError : ''"
            :favorite-ids="favoriteIds"
            :selected-pokemon-id="selectedPokemon?.id ?? null"
            @change-page="loadPage"
            @select-pokemon="viewPokemon($event.id)"
            @toggle-favorite="toggleFavorite"
            @retry="retryList"
          />
        </div>

        <div class="lg:col-span-2">
          <PokemonDetailCard
            :pokemon="selectedPokemon"
            :is-loading="detailLoading"
            :error="detailError"
            :is-favorite="selectedPokemonIsFavorite"
            :is-on-team="selectedPokemonIsOnTeam"
            :is-team-full="team.length >= 6"
            @toggle-favorite="toggleFavorite"
            @add-to-team="addToTeam"
            @retry="retryDetail"
          />
        </div>
      </div>

      <PokemonTeam
        :team="team"
        :selected-pokemon-id="selectedPokemon?.id ?? null"
        @move-up="moveTeamMemberByIndex($event, -1)"
        @move-down="moveTeamMemberByIndex($event, 1)"
        @remove-member="removeFromTeam"
        @select-pokemon="viewPokemon($event.id)"
      />
    </main>
  </div>
</template>

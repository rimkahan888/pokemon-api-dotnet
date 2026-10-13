<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { fetchPokemonDetail, fetchPokemonPage } from '@/services/pokemonApi'
import type { PokemonDetail, PokemonSummary } from '@/types/pokemon'

const pageSize = 20
const currentPage = ref(1)
const totalPages = ref(1)
const totalCount = ref(0)
const list = ref<PokemonSummary[]>([])
const selectedPokemon = ref<PokemonDetail | null>(null)
const favoriteIds = ref(loadFavoriteIds())
const listLoading = ref(false)
const detailLoading = ref(false)
const listError = ref('')
const detailError = ref('')
const search = ref('')
const filterText = ref('')
const sortBy = ref<'id-asc' | 'id-desc' | 'name-asc' | 'name-desc'>('id-asc')
const debounceHandle = ref<ReturnType<typeof setTimeout> | null>(null)
const debounceDelayMs = 350
const suppressDebouncedSearch = ref(false)

const hasPrev = computed(() => currentPage.value > 1)
const hasNext = computed(() => currentPage.value < totalPages.value)
const selectedPokemonIsFavorite = computed(() =>
  selectedPokemon.value !== null && favoriteIds.value.includes(selectedPokemon.value.id),
)
const filteredAndSortedList = computed(() => {
  const normalizedFilter = filterText.value.trim().toLowerCase()
  let items = list.value

  if (normalizedFilter) {
    items = items.filter((pokemon) => pokemon.name.toLowerCase().includes(normalizedFilter))
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
  listLoading.value = true
  listError.value = ''

  try {
    const payload = await fetchPokemonPage(page, pageSize)
    currentPage.value = payload.page
    totalPages.value = Math.max(payload.totalPages, 1)
    totalCount.value = payload.totalCount
    list.value = payload.items
  } catch (error) {
    listError.value = error instanceof Error ? error.message : 'Unable to load Pokémon list.'
    list.value = []
  } finally {
    listLoading.value = false
  }
}

async function loadPokemon(nameOrId: string): Promise<void> {
  detailLoading.value = true
  detailError.value = ''

  try {
    selectedPokemon.value = await fetchPokemonDetail(nameOrId)
  } catch (error) {
    selectedPokemon.value = null
    detailError.value = error instanceof Error ? error.message : 'Unable to load Pokémon details.'
  } finally {
    detailLoading.value = false
  }
}

async function searchPokemon(): Promise<void> {
  const query = search.value.trim()
  if (!query) {
    detailError.value = 'Enter a Pokémon name or ID.'
    return
  }

  if (debounceHandle.value) {
    clearTimeout(debounceHandle.value)
    debounceHandle.value = null
  }

  await loadPokemon(query)
}

async function viewPokemon(id: number): Promise<void> {
  suppressDebouncedSearch.value = true
  search.value = `${id}`
  try {
    await loadPokemon(`${id}`)
  } finally {
    suppressDebouncedSearch.value = false
  }
}

function toggleFavorite(): void {
  if (!selectedPokemon.value) return

  const id = selectedPokemon.value.id
  favoriteIds.value = selectedPokemonIsFavorite.value
    ? favoriteIds.value.filter((favoriteId) => favoriteId !== id)
    : [...favoriteIds.value, id]

  try {
    localStorage.setItem('pokemon-favorite-ids', JSON.stringify(favoriteIds.value))
  } catch {
    // Keep the current session usable when browser storage is unavailable.
  }
}

function loadFavoriteIds(): number[] {
  try {
    const stored = localStorage.getItem('pokemon-favorite-ids')
    const parsed: unknown = stored ? JSON.parse(stored) : []

    if (!Array.isArray(parsed)) return []

    return [...new Set(parsed.filter(
      (id): id is number => Number.isSafeInteger(id) && id > 0,
    ))]
  } catch {
    return []
  }
}

async function prevPage(): Promise<void> {
  if (!hasPrev.value || listLoading.value) return
  await loadPage(currentPage.value - 1)
}

async function nextPage(): Promise<void> {
  if (!hasNext.value || listLoading.value) return
  await loadPage(currentPage.value + 1)
}

onMounted(async () => {
  await loadPage(1)
})

watch(search, (value) => {
  if (suppressDebouncedSearch.value) {
    return
  }

  const query = value.trim()
  detailError.value = ''

  if (debounceHandle.value) {
    clearTimeout(debounceHandle.value)
    debounceHandle.value = null
  }

  if (!query) {
    return
  }

  debounceHandle.value = setTimeout(() => {
    void loadPokemon(query)
  }, debounceDelayMs)
})

onUnmounted(() => {
  if (debounceHandle.value) {
    clearTimeout(debounceHandle.value)
  }
})
</script>

<template>
  <div class="layout">
    <h1>Pokémon Data Explorer</h1>

    <section class="card">
      <form class="search" @submit.prevent="searchPokemon">
        <input
          v-model="search"
          type="text"
          placeholder="Search by name or ID"
          aria-label="Search Pokémon"
        >
        <button :disabled="detailLoading" type="submit">Search</button>
      </form>
      <p v-if="detailError" class="error">{{ detailError }}</p>
    </section>

    <div class="grid">
      <section class="card">
        <header class="sectionHeader">
          <h2>Pokémon List</h2>
          <p>{{ totalCount }} total</p>
        </header>
        <div class="controls">
          <input
            v-model="filterText"
            type="text"
            placeholder="Filter list by name"
            aria-label="Filter Pokémon list"
          >
          <select v-model="sortBy" aria-label="Sort Pokémon list">
            <option value="id-asc">ID (Ascending)</option>
            <option value="id-desc">ID (Descending)</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
          </select>
        </div>

        <p v-if="listLoading" class="state">Loading list...</p>
        <p v-else-if="listError" class="error">{{ listError }}</p>
        <p v-else-if="list.length === 0" class="state">No Pokémon found.</p>
        <p v-else-if="filteredAndSortedList.length === 0" class="state">No Pokémon match current filter.</p>

        <ul v-else class="list">
          <li v-for="pokemon in filteredAndSortedList" :key="pokemon.id">
            <button class="item" type="button" @click="viewPokemon(pokemon.id)">
              <img :src="pokemon.spriteUrl" :alt="pokemon.name">
              <span>#{{ pokemon.id }} {{ pokemon.name }}</span>
            </button>
          </li>
        </ul>

        <footer class="pager">
          <button :disabled="!hasPrev || listLoading" type="button" @click="prevPage">Previous</button>
          <span>Page {{ currentPage }} of {{ totalPages }}</span>
          <button :disabled="!hasNext || listLoading" type="button" @click="nextPage">Next</button>
        </footer>
      </section>

      <section class="card">
        <header class="sectionHeader">
          <h2>Pokémon Details</h2>
          <button v-if="selectedPokemon" type="button" @click="selectedPokemon = null">Back</button>
        </header>

        <p v-if="detailLoading" class="state">Loading details...</p>
        <p v-else-if="!selectedPokemon" class="state">Pick a Pokémon from the list or use search.</p>

        <article v-else class="detail">
          <img :src="selectedPokemon.spriteUrl" :alt="selectedPokemon.name">
          <h3>#{{ selectedPokemon.id }} {{ selectedPokemon.name }}</h3>
          <button
            type="button"
            :aria-pressed="selectedPokemonIsFavorite"
            :aria-label="selectedPokemonIsFavorite ? 'Remove from favorites' : 'Add to favorites'"
            @click="toggleFavorite"
          >
            {{ selectedPokemonIsFavorite ? '★ Favorite' : '☆ Add to favorites' }}
          </button>

          <p><strong>Types:</strong> {{ selectedPokemon.types.join(', ') }}</p>
          <p><strong>Abilities:</strong> {{ selectedPokemon.abilities.join(', ') }}</p>

          <h4>Stats</h4>
          <ul>
            <li v-for="stat in selectedPokemon.stats" :key="stat.name">
              {{ stat.name }}: {{ stat.value }}
            </li>
          </ul>
        </article>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { fetchPokemonDetail, fetchPokemonPage } from '@/services/pokemonApi'
import { analyzeTeam } from '@/services/teamAnalysis'
import type { PokemonDetail, PokemonSummary } from '@/types/pokemon'

const pageSize = 20
const currentPage = ref(1)
const totalPages = ref(1)
const totalCount = ref(0)
const list = ref<PokemonSummary[]>([])
const selectedPokemon = ref<PokemonDetail | null>(null)
const favoriteIds = ref(loadFavoriteIds())
const favoriteMetadata = ref(loadFavoriteMetadata())
const team = ref(loadTeam())
const listLoading = ref(false)
const detailLoading = ref(false)
const listError = ref('')
const detailError = ref('')
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

const hasPrev = computed(() => currentPage.value > 1)
const hasNext = computed(() => currentPage.value < totalPages.value)
const selectedPokemonIsFavorite = computed(() =>
  selectedPokemon.value !== null && favoriteIds.value.includes(selectedPokemon.value.id),
)
const selectedPokemonIsOnTeam = computed(() =>
  selectedPokemon.value !== null && team.value.some((pokemon) => pokemon.id === selectedPokemon.value?.id),
)
const teamAnalysis = computed(() => analyzeTeam(team.value))
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
    detailError.value = 'Enter a Pokémon name or ID.'
    return
  }

  if (detailDebounceHandle.value) {
    clearTimeout(detailDebounceHandle.value)
    detailDebounceHandle.value = null
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

  try {
    localStorage.setItem('pokemon-favorite-ids', JSON.stringify(favoriteIds.value))
    localStorage.setItem('pokemon-favorite-metadata', JSON.stringify(favoriteMetadata.value))
  } catch {
    // Keep the current session usable when browser storage is unavailable.
  }
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

  try {
    localStorage.setItem('pokemon-favorite-metadata', JSON.stringify(favoriteMetadata.value))
  } catch {
    // Keep the current session usable when browser storage is unavailable.
  }
}

function addToTeam(): void {
  if (!selectedPokemon.value || selectedPokemonIsOnTeam.value || team.value.length >= 6) return

  team.value = [...team.value, selectedPokemon.value]
  saveTeam()
}

function removeFromTeam(id: number): void {
  team.value = team.value.filter((pokemon) => pokemon.id !== id)
  saveTeam()
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
  saveTeam()
}

function saveTeam(): void {
  try {
    localStorage.setItem('pokemon-team', JSON.stringify(team.value))
  } catch {
    // Keep the current session usable when browser storage is unavailable.
  }
}

function loadTeam(): PokemonDetail[] {
  try {
    const stored = localStorage.getItem('pokemon-team')
    const parsed: unknown = stored ? JSON.parse(stored) : []

    if (!Array.isArray(parsed)) return []

    const validPokemon = parsed.filter((pokemon): pokemon is PokemonDetail =>
      typeof pokemon === 'object'
      && pokemon !== null
      && Number.isSafeInteger(pokemon.id)
      && pokemon.id > 0
      && typeof pokemon.name === 'string'
      && Array.isArray(pokemon.types)
      && pokemon.types.every((type: unknown) => typeof type === 'string')
      && Array.isArray(pokemon.abilities)
      && Array.isArray(pokemon.stats)
      && typeof pokemon.spriteUrl === 'string',
    )

    return [...new Map(validPokemon.map((pokemon) => [pokemon.id, pokemon])).values()].slice(0, 6)
  } catch {
    return []
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

function loadFavoriteMetadata(): PokemonSummary[] {
  try {
    const stored = localStorage.getItem('pokemon-favorite-metadata')
    const parsed: unknown = stored ? JSON.parse(stored) : []

    if (!Array.isArray(parsed)) return []

    return [...new Map(parsed.filter((pokemon): pokemon is PokemonSummary =>
      typeof pokemon === 'object'
      && pokemon !== null
      && Number.isSafeInteger(pokemon.id)
      && pokemon.id > 0
      && favoriteIds.value.includes(pokemon.id)
      && typeof pokemon.name === 'string'
      && typeof pokemon.spriteUrl === 'string',
    ).map((pokemon) => [pokemon.id, pokemon])).values()]
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

function retryList(): void {
  void loadPage(currentPage.value || 1)
}

function retryDetail(): void {
  const query = search.value.trim()
  if (!query) return
  void loadPokemon(query)
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
  <div id="main-content" class="layout">
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
      <div v-if="detailError" class="errorBanner">
        <p class="error" role="alert">{{ detailError }}</p>
        <button v-if="search.trim()" type="button" aria-label="Retry loading Pokémon details" @click="retryDetail">Try again</button>
      </div>
    </section>

    <div class="grid">
      <section class="card">
        <header class="sectionHeader">
          <h2>{{ viewMode === 'all' ? 'Pokémon List' : 'Favorites' }}</h2>
          <p>{{ viewMode === 'all' ? `${totalCount} total` : `${favoriteIds.length} saved` }}</p>
        </header>
        <div class="viewTabs" role="group" aria-label="Pokémon collection">
          <button
            type="button"
            :aria-pressed="viewMode === 'all'"
            @click="viewMode = 'all'"
          >All Pokémon</button>
          <button
            type="button"
            :aria-pressed="viewMode === 'favorites'"
            @click="viewMode = 'favorites'"
          >Favorites</button>
        </div>
        <div class="controls">
          <input
            v-model="filterText"
            type="text"
            placeholder="Search full catalog by name or ID"
            aria-label="Search Pokémon catalog"
          >
          <select v-model="sortBy" aria-label="Sort Pokémon list">
            <option value="id-asc">ID (Ascending)</option>
            <option value="id-desc">ID (Descending)</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
          </select>
        </div>

        <p v-if="viewMode === 'all' && listLoading" class="state" aria-live="polite">Loading list...</p>
        <div v-else-if="viewMode === 'all' && listError" class="errorBanner">
          <p class="error" role="alert">{{ listError }}</p>
          <button type="button" aria-label="Retry loading the Pokémon list" @click="retryList">Try again</button>
        </div>
        <p v-else-if="viewMode === 'favorites' && favoriteIds.length === 0" class="state">No favorites yet.</p>
        <p v-else-if="viewMode === 'all' && list.length === 0 && !filterText.trim()" class="state">No Pokémon found.</p>
        <p v-else-if="filteredAndSortedList.length === 0" class="state">No Pokémon match current filter.</p>

        <ul v-else class="list">
          <li v-for="pokemon in filteredAndSortedList" :key="pokemon.id">
            <div class="listEntry">
              <button
                class="item"
                type="button"
                :aria-label="`View Pokémon #${pokemon.id}${pokemon.name ? ` ${pokemon.name}` : ''}`"
                @click="viewPokemon(pokemon.id)"
              >
                <img v-if="pokemon.spriteUrl" :src="pokemon.spriteUrl" :alt="pokemon.name">
                <span>#{{ pokemon.id }}{{ pokemon.name ? ` ${pokemon.name}` : '' }}</span>
              </button>
              <button
                type="button"
                :aria-pressed="favoriteIds.includes(pokemon.id)"
                :aria-label="favoriteIds.includes(pokemon.id) ? `Remove ${pokemon.name || `Pokémon #${pokemon.id}`} from favorites` : `Add ${pokemon.name || `Pokémon #${pokemon.id}`} to favorites`"
                @click="toggleFavorite(pokemon)"
              >
                {{ favoriteIds.includes(pokemon.id) ? '★' : '☆' }}
              </button>
            </div>
          </li>
        </ul>

        <footer v-if="viewMode === 'all'" class="pager">
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

        <p v-if="detailLoading" class="state" aria-live="polite">Loading details...</p>
        <p v-else-if="!selectedPokemon" class="state">Pick a Pokémon from the list or use search.</p>

        <article v-else class="detail">
          <img :src="selectedPokemon.spriteUrl" :alt="selectedPokemon.name">
          <h3>#{{ selectedPokemon.id }} {{ selectedPokemon.name }}</h3>
          <button
            type="button"
            :aria-pressed="selectedPokemonIsFavorite"
            :aria-label="selectedPokemonIsFavorite ? 'Remove from favorites' : 'Add to favorites'"
            @click="toggleFavorite(selectedPokemon)"
          >
            {{ selectedPokemonIsFavorite ? '★ Favorite' : '☆ Add to favorites' }}
          </button>
          <button
            type="button"
            :disabled="selectedPokemonIsOnTeam || team.length >= 6"
            @click="addToTeam"
          >
            {{ selectedPokemonIsOnTeam ? 'On team' : team.length >= 6 ? 'Team full' : 'Add to team' }}
          </button>
          <p v-if="team.length >= 6 && !selectedPokemonIsOnTeam" class="state">
            Your team is full. Remove a Pokémon to add another.
          </p>

          <p><strong>Types:</strong> {{ selectedPokemon.types.join(', ') }}</p>
          <p><strong>Abilities:</strong> {{ selectedPokemon.abilities.join(', ') }}</p>

          <h4>Stats</h4>
          <ul class="statList">
            <li v-for="stat in selectedPokemon.stats" :key="stat.name" class="statRow">
              <span>{{ stat.name }}: {{ stat.value }}</span>
              <meter min="0" max="255" :value="stat.value" :aria-label="`${stat.name} base stat`"></meter>
            </li>
          </ul>
        </article>
      </section>
    </div>

    <section class="card teamSection" aria-labelledby="team-heading">
      <header class="sectionHeader">
        <h2 id="team-heading">My Team</h2>
        <p aria-live="polite">{{ team.length }} / 6 Pokémon</p>
      </header>
      <p v-if="team.length === 0" class="state">Your team is empty. Select a Pokémon and add it to your team.</p>
      <div v-else class="teamContent">
        <ul class="teamList" aria-label="Team members">
          <li v-for="(pokemon, index) in team" :key="pokemon.id" class="teamMember">
            <img :src="pokemon.spriteUrl" :alt="`${pokemon.name} artwork`">
            <div class="teamMemberInfo">
              <strong>#{{ pokemon.id }} {{ pokemon.name }}</strong>
              <p>{{ pokemon.types.join(', ') }}</p>
            </div>
            <div class="teamActions">
              <button
                type="button"
                :disabled="index === 0"
                :aria-label="`Move ${pokemon.name} up`"
                @click="moveTeamMember(pokemon.id, -1)"
              >↑</button>
              <button
                type="button"
                :disabled="index === team.length - 1"
                :aria-label="`Move ${pokemon.name} down`"
                @click="moveTeamMember(pokemon.id, 1)"
              >↓</button>
              <button
                type="button"
                :aria-label="`Remove ${pokemon.name} from team`"
                @click="removeFromTeam(pokemon.id)"
              >Remove</button>
            </div>
          </li>
        </ul>

        <section class="teamAnalysis" aria-labelledby="team-analysis-heading">
          <h3 id="team-analysis-heading">Team type analysis</h3>
          <p><strong>Type coverage:</strong> {{ teamAnalysis.coverage.length }} of 18 types</p>
          <ul class="typeList" aria-label="Types represented in team">
            <li v-for="type in teamAnalysis.coverage" :key="type">{{ type }}</li>
          </ul>
          <h4>Shared weaknesses</h4>
          <ul v-if="teamAnalysis.sharedWeaknesses.length" class="weaknessList">
            <li v-for="weakness in teamAnalysis.sharedWeaknesses" :key="weakness.type">
              <strong>{{ weakness.type }}</strong>: {{ weakness.pokemonNames.length }} Pokémon
              ({{ weakness.pokemonNames.join(', ') }})
            </li>
          </ul>
          <p v-else class="state">No shared weaknesses across two or more team members.</p>
        </section>
      </div>
    </section>
  </div>
</template>

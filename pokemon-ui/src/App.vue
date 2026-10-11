<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { fetchPokemonDetail, fetchPokemonPage } from '@/services/pokemonApi'
import type { PokemonDetail, PokemonSummary } from '@/types/pokemon'

const pageSize = 20
const currentPage = ref(1)
const totalPages = ref(1)
const totalCount = ref(0)
const list = ref<PokemonSummary[]>([])
const selectedPokemon = ref<PokemonDetail | null>(null)
const listLoading = ref(false)
const detailLoading = ref(false)
const listError = ref('')
const detailError = ref('')
const search = ref('')

const hasPrev = computed(() => currentPage.value > 1)
const hasNext = computed(() => currentPage.value < totalPages.value)

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

  await loadPokemon(query)
}

async function viewPokemon(id: number): Promise<void> {
  search.value = `${id}`
  await loadPokemon(`${id}`)
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

        <p v-if="listLoading" class="state">Loading list...</p>
        <p v-else-if="listError" class="error">{{ listError }}</p>
        <p v-else-if="list.length === 0" class="state">No Pokémon found.</p>

        <ul v-else class="list">
          <li v-for="pokemon in list" :key="pokemon.id">
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

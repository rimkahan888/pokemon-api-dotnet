<script setup lang="ts">
import { Search, Sparkles } from '@lucide/vue'

defineProps<{
  teamCount: number
  validationError: string
}>()

const query = defineModel<string>({ required: true })

const emit = defineEmits<{
  submit: []
  scrollToTeam: []
}>()
</script>

<template>
  <header class="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles class="w-4 h-4" />
          </div>
          <h1 class="text-base sm:text-lg font-bold tracking-tight text-zinc-100">
            Pokémon Data Explorer
          </h1>
        </div>

        <button
          type="button"
          class="sm:hidden px-2.5 py-1 text-xs font-medium rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-amber-400 hover:border-amber-500/40 transition-colors flex items-center gap-1.5"
          aria-label="Jump to Team roster"
          @click="emit('scrollToTeam')"
        >
          <span>Team</span>
          <span class="px-1.5 py-0.2 rounded bg-zinc-800 text-amber-400 text-xs tabular-nums">{{ teamCount }}/6</span>
        </button>
      </div>

      <div class="w-full sm:w-auto flex-1 max-w-lg">
        <form class="relative" role="search" @submit.prevent="emit('submit')">
          <div class="flex items-center gap-2">
            <input
              v-model="query"
              type="text"
              placeholder="Search by name or ID"
              maxlength="50"
              class="w-full bg-zinc-900/90 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              aria-label="Search Pokémon"
            />
            <button
              type="submit"
              class="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-amber-500/50 text-zinc-200 hover:text-amber-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 shrink-0"
              aria-label="Search Pokémon details"
            >
              <Search class="w-4 h-4" />
              <span class="hidden sm:inline">Search</span>
            </button>
          </div>
          <p
            v-if="validationError"
            class="absolute -bottom-5 left-1 text-xs text-rose-400 font-medium"
            role="alert"
          >
            {{ validationError }}
          </p>
        </form>
      </div>

      <div class="hidden sm:flex items-center gap-3 shrink-0">
        <button
          type="button"
          class="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-amber-400 hover:border-amber-500/40 transition-colors flex items-center gap-2"
          aria-label="Jump to Team roster"
          @click="emit('scrollToTeam')"
        >
          <span>Team Roster</span>
          <span class="px-2 py-0.5 rounded-full bg-zinc-800 text-amber-400 tabular-nums font-semibold">{{ teamCount }}/6</span>
        </button>
      </div>
    </div>
  </header>
</template>

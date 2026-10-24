<script setup lang="ts">
import { computed } from 'vue'
import { ArrowDown, ArrowUp, Shield, ShieldAlert, Trash2, Users } from '@lucide/vue'
import { analyzeTeam, POKEMON_TYPES } from '@/services/teamAnalysis'
import type { PokemonDetail } from '@/types/pokemon'

const props = defineProps<{
  team: PokemonDetail[]
  selectedPokemonId: number | null
}>()

const emit = defineEmits<{
  'move-up': [index: number]
  'move-down': [index: number]
  'remove-member': [id: number]
  'select-pokemon': [pokemon: PokemonDetail]
}>()

const analysis = computed(() => analyzeTeam(props.team))
</script>

<template>
  <section id="team-section" class="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 sm:p-6 shadow-lg">
    <div class="flex items-center justify-between pb-4 border-b border-zinc-800/80 gap-3">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <Users class="w-4 h-4" />
        </div>
        <div>
          <h2 class="text-lg font-semibold text-zinc-100 tracking-tight">Team Roster</h2>
          <p class="text-xs text-zinc-400">Build a team of up to six Pokémon with live type synergy</p>
        </div>
      </div>
      <p class="px-3 py-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-semibold tabular-nums text-zinc-200" aria-live="polite">
        <span class="text-amber-400">{{ team.length }}</span> / 6 Pokémon
      </p>
    </div>

    <p v-if="team.length >= 6" class="pt-4 text-xs text-amber-300">Your team is full.</p>

    <div
      v-if="team.length === 0"
      class="py-12 px-4 text-center text-zinc-400 flex flex-col items-center justify-center"
    >
      <div class="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
        <Users class="w-6 h-6" />
      </div>
      <p class="text-sm font-medium text-zinc-300">Your team is empty.</p>
      <p class="text-xs text-zinc-500 mt-1 max-w-sm">
        Select a Pokémon, then add it to a team of up to six.
      </p>
    </div>

    <div v-else class="pt-5 space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="(member, index) in team"
          :key="member.id"
          class="group bg-zinc-950/80 border rounded-xl p-3 flex items-center justify-between gap-3 cursor-pointer"
          :class="selectedPokemonId === member.id ? 'border-amber-500/40 bg-amber-500/5' : 'border-zinc-800/80'"
          tabindex="0"
          @click="emit('select-pokemon', member)"
          @keydown.enter="emit('select-pokemon', member)"
        >
          <div class="teamMemberInfo flex items-center gap-3 min-w-0">
            <img
              :src="member.spriteUrl"
              :alt="`${member.name} artwork`"
              class="w-11 h-11 object-contain image-rendering-pixelated"
            />
            <div class="truncate">
              <h4 class="text-sm font-semibold capitalize text-zinc-100 truncate">
                <strong>#{{ member.id }} {{ member.name }}</strong>
              </h4>
              <p class="text-[11px] text-zinc-400 capitalize truncate">{{ member.types.join(', ') }}</p>
            </div>
          </div>

          <div class="flex items-center gap-1 shrink-0" @click.stop>
            <button
              type="button"
              class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 disabled:opacity-30"
              :disabled="index === 0"
              :aria-label="`Move ${member.name} up`"
              @click="emit('move-up', index)"
            >
              <ArrowUp class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 disabled:opacity-30"
              :disabled="index === team.length - 1"
              :aria-label="`Move ${member.name} down`"
              @click="emit('move-down', index)"
            >
              <ArrowDown class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              class="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30"
              :aria-label="`Remove ${member.name} from team`"
              @click="emit('remove-member', member.id)"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-zinc-800/80">
        <div class="bg-zinc-950/70 border border-zinc-800/70 rounded-xl p-4">
          <div class="flex items-center justify-between pb-3 border-b border-zinc-800/60">
            <div class="flex items-center gap-2">
              <Shield class="w-4 h-4 text-amber-400" />
              <h3 class="text-sm font-semibold text-zinc-100">Type Coverage</h3>
            </div>
            <p class="sr-only">Type coverage: {{ analysis.coverage.length }} of 18 types</p>
            <span class="text-xs font-semibold tabular-nums text-amber-400">
              {{ analysis.coverage.length }} of 18 types
            </span>
          </div>
          <div class="mt-3 flex flex-wrap gap-1.5">
            <span
              v-for="type in POKEMON_TYPES"
              :key="type"
              class="px-2 py-0.5 rounded text-[11px] font-medium capitalize"
              :class="analysis.coverage.includes(type)
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-zinc-900/60 text-zinc-600 border border-zinc-900'"
            >
              {{ type }}
            </span>
          </div>
        </div>

        <div class="bg-zinc-950/70 border border-zinc-800/70 rounded-xl p-4">
          <div class="flex items-center justify-between pb-3 border-b border-zinc-800/60">
            <div class="flex items-center gap-2">
              <ShieldAlert class="w-4 h-4 text-rose-400" />
              <h3 class="text-sm font-semibold text-zinc-100">Shared Weaknesses</h3>
            </div>
          </div>
          <p v-if="analysis.sharedWeaknesses.length === 0" class="mt-3 text-xs text-emerald-400">
            No shared weaknesses found across team members.
          </p>
          <ul v-else class="mt-3 space-y-2">
            <li
              v-for="weakness in analysis.sharedWeaknesses"
              :key="weakness.type"
              class="text-xs text-zinc-300"
            >
              <span class="capitalize text-rose-300 font-semibold">{{ weakness.type }}</span>: {{ weakness.pokemonNames.length }} Pokémon ({{ weakness.pokemonNames.join(', ') }})
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

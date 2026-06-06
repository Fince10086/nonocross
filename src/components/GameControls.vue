<script setup>
const props = defineProps({
  isPaused: { type: Boolean, default: false },
  isComplete: { type: Boolean, default: false },
  historyLength: { type: Number, default: 0 },
  isGenerating: { type: Boolean, default: false },
  currentSolution: { type: Array, default: null },
  isInFavorites: { type: Boolean, default: false },
  puzzleBankLoaded: { type: Boolean, default: false },
  selectedStar: { type: Number, default: 1 },
  availableStars: { type: Array, default: () => [] },
  puzzlesForStar: { type: Array, default: () => [] },
  currentPuzzleId: { type: String, default: null },
})

import { formatStars } from '../utils.js'

const emit = defineEmits([
  'togglePause',
  'undo',
  'restart',
  'generateNewPuzzle',
  'showImport',
  'exportPuzzle',
  'saveCurrentPuzzle',
  'deleteFromFavorites',
  'selectStar',
  'selectBankPuzzle',
  'showHelp',
  'showAssist',
])
</script>

<template>
  <div class="controls">
    <!-- Row 1: Game actions -->
    <div class="controls-row">
      <div class="btn-group">
        <button class="btn" @click="$emit('togglePause')">
          {{ isPaused ? 'Resume' : 'Pause' }}
        </button>
        <button
          class="btn"
          @click="$emit('undo')"
          :disabled="historyLength === 0 || isComplete"
        >
          Undo
        </button>
        <button class="btn" @click="$emit('restart')">Restart</button>
        <button
          class="btn"
          @click="$emit('generateNewPuzzle')"
          :disabled="isGenerating"
        >
          {{ isGenerating ? 'Generating...' : 'New Random' }}
        </button>
      </div>
    </div>

    <!-- Row 2: Puzzle Picker -->
    <div v-if="puzzleBankLoaded" class="controls-row">
      <div class="btn-group">
        <select
          class="puzzle-select"
          :value="selectedStar"
          @change="$emit('selectStar', parseFloat($event.target.value))"
        >
          <option v-for="star in availableStars" :key="star" :value="star">
            {{ formatStars(star) }}
          </option>
        </select>
        <select
          class="puzzle-select"
          :value="currentPuzzleId || ''"
          @change="$emit('selectBankPuzzle', puzzlesForStar.find((p) => p.id === $event.target.value))"
        >
          <option v-for="p in puzzlesForStar" :key="p.id" :value="p.id">
            {{ p.id }}
          </option>
        </select>
      </div>
      <button class="btn btn-icon" @click="$emit('showHelp')" title="Help">?</button>
      <button class="btn btn-icon" @click="$emit('showAssist')" title="Assist">&#9881;</button>
    </div>

    <!-- Row 3: Import / Export / Save / Delete -->
    <div class="controls-row">
      <div class="btn-group">
        <button class="btn" @click="$emit('showImport')">Import</button>
        <button class="btn" @click="$emit('exportPuzzle')">Export</button>
        <button
          class="btn"
          @click="$emit('saveCurrentPuzzle')"
          :disabled="!currentSolution"
        >
          {{ isInFavorites ? 'Update' : 'Save' }}
        </button>
        <button
          class="btn"
          @click="$emit('deleteFromFavorites')"
          :disabled="!isInFavorites"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.controls-row {
  display: flex;
  justify-content: center;
}

.puzzle-select {
  padding: 0px 12px;
  font-size: 0.875rem;
  font-weight: 600;
  background: #fff;
  cursor: pointer;
}

.controls-row .btn-icon {
  margin-left: 8px;
}
</style>

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
  isLevelMode: { type: Boolean, default: false },
})

import { formatStars } from '../utils.js'
import { t, currentLang, LANGUAGE_LABELS } from '../i18n.js'

const emit = defineEmits([
  'togglePause',
  'undo',
  'restart',
  'generateNewPuzzle',
  'nextLevel',
  'showImport',
  'exportPuzzle',
  'saveCurrentPuzzle',
  'deleteFromFavorites',
  'selectStar',
  'selectBankPuzzle',
  'showHelp',
  'showAssist',
  'switchLang',
])
</script>

<template>
  <div class="controls">
    <!-- Row 1: Game actions -->
    <div class="controls-row">
      <div class="btn-group">
        <button
          v-if="isComplete"
          class="btn"
          @click="$emit(isLevelMode ? 'nextLevel' : 'generateNewPuzzle')"
        >
          {{ isLevelMode ? t('nextLevel') : t('newPuzzle') }}
        </button>
        <button v-else class="btn" @click="$emit('togglePause')">
          {{ isPaused ? t('resume') : t('pause') }}
        </button>
        <button
          class="btn"
          @click="$emit('undo')"
          :disabled="historyLength === 0 || isComplete"
        >
          {{ t('undo') }}
        </button>
        <button class="btn" @click="$emit('restart')">{{ t('restart') }}</button>
      </div>
    </div>

    <!-- Row 2: Settings buttons -->
    <div class="controls-row">
      <div class="btn-group">
        <button class="btn btn-icon" @click="$emit('showHelp')" :title="t('help')">?</button>
        <button class="btn btn-icon" @click="$emit('showAssist')" :title="t('assistSettings')">&#9881;</button>
        <button class="btn btn-icon" @click="$emit('switchLang')">{{ LANGUAGE_LABELS[currentLang] }}</button>
      </div>
    </div>

    <!-- Row 3: Import / Export / Save / Delete -->
    <div class="controls-row">
      <div class="btn-group">
        <button class="btn" @click="$emit('showImport')">{{ t('import') }}</button>
        <button class="btn" @click="$emit('exportPuzzle')">{{ t('export') }}</button>
        <button
          class="btn"
          @click="$emit('saveCurrentPuzzle')"
          :disabled="!currentSolution"
        >
          {{ isInFavorites ? t('update') : t('save') }}
        </button>
        <button
          class="btn"
          @click="$emit('deleteFromFavorites')"
          :disabled="!isInFavorites"
        >
          {{ t('delete') }}
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
  gap: 8px;
}

.puzzle-select {
  padding: 0px 12px;
  font-size: 0.875rem;
  font-weight: 600;
  background: #fff;
  cursor: pointer;
}
</style>

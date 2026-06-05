<script setup>
const props = defineProps({
  isPaused: { type: Boolean, default: false },
  isComplete: { type: Boolean, default: false },
  historyLength: { type: Number, default: 0 },
  isGenerating: { type: Boolean, default: false },
  currentSolution: { type: Array, default: null },
  isInFavorites: { type: Boolean, default: false },
})

const emit = defineEmits([
  'togglePause',
  'undo',
  'restart',
  'generateNewPuzzle',
  'showImport',
  'exportPuzzle',
  'saveCurrentPuzzle',
  'deleteFromFavorites',
])
</script>

<template>
  <div class="controls">
    <!-- Row 1: Game actions -->
    <div class="controls-row">
      <div class="btn-group">
        <button class="action-btn" @click="$emit('togglePause')">
          {{ isPaused ? 'Resume' : 'Pause' }}
        </button>
        <button
          class="action-btn"
          @click="$emit('undo')"
          :disabled="historyLength === 0 || isComplete"
        >
          Undo
        </button>
        <button class="action-btn" @click="$emit('restart')">Restart</button>
        <button
          class="action-btn"
          @click="$emit('generateNewPuzzle')"
          :disabled="isGenerating"
        >
          {{ isGenerating ? 'Generating...' : 'New Random' }}
        </button>
      </div>
    </div>

    <!-- Row 3: Import / Export / Save / Delete -->
    <div class="controls-row">
      <div class="btn-group">
        <button class="action-btn" @click="$emit('showImport')">Import</button>
        <button class="action-btn" @click="$emit('exportPuzzle')">Export</button>
        <button
          class="action-btn"
          @click="$emit('saveCurrentPuzzle')"
          :disabled="!currentSolution"
        >
          {{ isInFavorites ? 'Update' : 'Save' }}
        </button>
        <button
          class="action-btn"
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

.btn-group {
  display: flex;
  gap: 0;
  border: 2px solid #000;
}

.action-btn {
  padding: 8px 16px;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  background: #fff;
  color: #000;
  cursor: pointer;
  transition: background 0.15s;
}

.action-btn + .action-btn {
  border-left: 2px solid #000;
}

.action-btn:hover:not(:disabled) {
  background: #f0f0f0;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>

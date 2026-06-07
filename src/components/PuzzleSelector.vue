<script setup>
const props = defineProps({
  puzzleBankLoaded: { type: Boolean, default: false },
  selectedStar: { type: Number, default: 1 },
  availableStars: { type: Array, default: () => [] },
  puzzlesForStar: { type: Array, default: () => [] },
  currentPuzzleId: { type: String, default: null },
  currentSize: { type: Number, default: 10 },
})

import { formatStars } from '../utils.js'

const emit = defineEmits(['changeSize', 'selectStar', 'selectBankPuzzle'])
</script>

<template>
  <div class="top-bar">
    <div class="btn-group">
      <button
        class="btn"
        :class="{ active: currentSize === 5 }"
        @click="$emit('changeSize', 5)"
      >
        5×5
      </button>
      <button
        class="btn"
        :class="{ active: currentSize === 10 }"
        @click="$emit('changeSize', 10)"
      >
        10×10
      </button>
      <button
        class="btn"
        :class="{ active: currentSize === 15 }"
        @click="$emit('changeSize', 15)"
      >
        15×15
      </button>
    </div>
  </div>
</template>

<style scoped>
.top-bar {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: center;
}

.puzzle-select {
  padding: 8px 12px;
  font-size: 0.875rem;
  font-weight: 600;
  border: 2px solid #000;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}

@media (max-width: 600px) {
  .top-bar {
    gap: 12px;
  }
  .mode-btn {
    padding: 6px 12px;
    font-size: 0.8rem;
  }
}
</style>

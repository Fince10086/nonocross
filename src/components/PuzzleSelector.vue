<script setup>
const props = defineProps({
  puzzleBankLoaded: { type: Boolean, default: false },
  selectedStar: { type: Number, default: 1 },
  availableStars: { type: Array, default: () => [] },
  puzzlesForStar: { type: Array, default: () => [] },
  currentPuzzleId: { type: String, default: null },
  currentSize: { type: Number, default: 10 },
})

const emit = defineEmits(['changeSize', 'selectStar', 'selectBankPuzzle'])

function formatStars(rating) {
  const full = Math.floor(rating)
  const half = rating % 1 === 0.5
  const empty = 5 - full - (half ? 1 : 0)
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty)
}
</script>

<template>
  <div class="top-bar">
    <div class="btn-group">
      <button
        class="mode-btn"
        :class="{ active: currentSize === 5 }"
        @click="$emit('changeSize', 5)"
      >
        5×5
      </button>
      <button
        class="mode-btn"
        :class="{ active: currentSize === 10 }"
        @click="$emit('changeSize', 10)"
      >
        10×10
      </button>
      <button
        class="mode-btn"
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

.btn-group {
  display: flex;
  gap: 0;
  border: 2px solid #000;
}

.mode-btn {
  padding: 8px 16px;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  background: #fff;
  color: #000;
  cursor: pointer;
  transition: background 0.15s;
}

.mode-btn + .mode-btn {
  border-left: 2px solid #000;
}

.mode-btn.active {
  background: #000;
  color: #fff;
}

.mode-btn:hover:not(.active) {
  background: #f0f0f0;
}

.picker-group {
  display: flex;
  gap: 0;
  border: 2px solid #000;
}

.picker-group .puzzle-select {
  border: none;
  border-right: 2px solid #000;
}

.picker-group .puzzle-select:last-child {
  border-right: none;
}

.puzzle-select {
  padding: 8px 12px;
  font-size: 0.875rem;
  font-weight: 600;
  border: 2px solid #000;
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

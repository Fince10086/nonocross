<script setup>
const props = defineProps({
  favorites: { type: Array, default: () => [] },
})

const emit = defineEmits(['loadFavorite'])

function formatTimeFromSeconds(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const s = (totalSeconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function formatSavedTime(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  return (
    d.toLocaleDateString() +
    ' ' +
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  )
}
</script>

<template>
  <div v-if="favorites.length > 0" class="favorites-section">
    <div class="favorites-header">
      <span class="label">Favorites ({{ favorites.length }})</span>
    </div>
    <div class="favorites-list">
      <div
        v-for="fav in favorites"
        :key="fav.code"
        class="favorite-item"
        :class="{ completed: fav.completed }"
        @click="$emit('loadFavorite', fav)"
      >
        <div class="fav-code">
          {{ fav.code.split(':')[1]?.slice(0, 8) || 'Custom' }}...
        </div>
        <div class="fav-meta">
          <span class="fav-size">{{ fav.size }}×{{ fav.size }}</span>
          <span v-if="fav.starsText" class="fav-stars">{{ fav.starsText }}</span>
          <span v-if="fav.completed" class="fav-status"
            >✓ {{ formatTimeFromSeconds(fav.seconds) }}</span
          >
          <span v-else class="fav-status in-progress"
            >⏱ {{ formatTimeFromSeconds(fav.seconds) }}</span
          >
        </div>
        <div class="fav-saved">
          {{ formatSavedTime(fav.savedAt) }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.favorites-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 600px;
}

.favorites-header {
  display: flex;
  align-items: center;
  justify-content: center;
}

.favorites-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.favorite-item {
  border: 2px solid #000;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.15s;
  min-width: 140px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.favorite-item:hover {
  background-color: #f5f5f5;
}

.favorite-item.completed {
  border-color: #888;
  opacity: 0.8;
}

.fav-code {
  font-size: 0.75rem;
  font-weight: 700;
  word-break: break-all;
}

.fav-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 0.75rem;
}

.fav-size {
  font-weight: 600;
}

.fav-stars {
  font-size: 0.7rem;
}

.fav-status {
  font-weight: 600;
  color: #388e3c;
}

.fav-status.in-progress {
  color: #f57c00;
}

.fav-saved {
  font-size: 0.65rem;
  color: #888;
}
</style>

<script setup>
import { ref, computed, watch } from 'vue'
import { t } from '../i18n.js'

const props = defineProps({
  show: { type: Boolean, default: false },
  levelsData: { type: Object, default: null },
  completedLevel: { type: Number, default: 0 },
  completedCount: { type: Number, default: 0 },
  unlockedMax: { type: Number, default: 10 },
  records: { type: Array, default: () => [] },
})

const emit = defineEmits(['selectLevel', 'close'])

const LEVELS_PER_PAGE = 100
const currentPage = ref(1)

const totalPages = computed(() => Math.ceil(2700 / LEVELS_PER_PAGE))

const pageLevels = computed(() => {
  const start = (currentPage.value - 1) * LEVELS_PER_PAGE + 1
  const end = Math.min(currentPage.value * LEVELS_PER_PAGE, 2700)
  const levels = []
  for (let i = start; i <= end; i++) {
    levels.push(i)
  }
  return levels
})

function getLevelInfo(level) {
  if (!props.levelsData?.levels) return null
  return props.levelsData.levels.find(l => l.level === level) || null
}

function isCompleted(level) {
  return props.records.some(r => r.level === level)
}

function isUnlocked(level) {
  return level <= props.unlockedMax
}

function isLocked(level) {
  return !isUnlocked(level)
}

function getRecord(level) {
  return props.records.find(r => r.level === level) || null
}

function formatTime(seconds) {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function handleSelect(level) {
  if (isUnlocked(level)) {
    emit('selectLevel', level)
  }
}

function handleClose() {
  emit('close')
}

function prevPage() {
  if (currentPage.value > 1) currentPage.value--
}

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++
}

function goToPage(page) {
  currentPage.value = page
}

watch(() => props.show, (show) => {
  if (show) {
    const targetPage = Math.ceil((props.completedLevel + 1) / LEVELS_PER_PAGE)
    currentPage.value = Math.min(targetPage, totalPages.value)
  }
})

const pageButtons = computed(() => {
  const buttons = []
  const maxButtons = 7
  let start = Math.max(1, currentPage.value - 3)
  let end = Math.min(totalPages.value, start + maxButtons - 1)
  
  if (end - start + 1 < maxButtons) {
    start = Math.max(1, end - maxButtons + 1)
  }
  
  for (let i = start; i <= end; i++) {
    buttons.push(i)
  }
  return buttons
})

function formatStars(stars) {
  if (!stars) return ''
  if (stars <= 2.5) return '★' + stars
  if (stars <= 4) return '★' + stars
  return '★' + stars
}
</script>

<template>
  <div v-if="show" class="modal-overlay" @click.self="handleClose">
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">{{ t('levels') }}</h3>
        <div class="progress-info">
          <span>{{ t('completed') }}: {{ completedCount }}/2700</span>
        </div>
      </div>

      <!-- 页码导航 -->
      <div class="pagination">
        <button class="btn btn-icon" @click="prevPage" :disabled="currentPage === 1">&lt;</button>
        <div class="page-numbers">
          <button
            v-for="page in pageButtons"
            :key="page"
            class="btn btn-icon"
            :class="{ active: page === currentPage }"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
        </div>
        <button class="btn btn-icon" @click="nextPage" :disabled="currentPage === totalPages">>></button>
      </div>

      <!-- 关卡网格 -->
      <div class="levels-grid">
        <div
          v-for="level in pageLevels"
          :key="level"
          class="level-cell"
          :class="{
            completed: isCompleted(level),
            unlocked: isUnlocked(level) && !isCompleted(level),
            locked: isLocked(level),
          }"
          @click="handleSelect(level)"
        >
          <div class="level-main">
            <span class="level-number">{{ level }}</span>
            <span v-if="isCompleted(level)" class="level-check">✓</span>
            <span v-else-if="isLocked(level)" class="level-lock">●</span>
          </div>
          <div v-if="getLevelInfo(level)" class="level-meta">
            <span class="level-size">{{ getLevelInfo(level).size }}×{{ getLevelInfo(level).size }}</span>
            <span class="level-stars">{{ getLevelInfo(level).stars }}★</span>
          </div>
          <div v-if="getRecord(level)" class="level-time">
            {{ formatTime(getRecord(level).time) }}
            <span v-if="getRecord(level).assisted" class="assist-mark">*</span>
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn" @click="handleClose">{{ t('close') }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  z-index: 100;
  padding: 20px;
  box-sizing: border-box;
}

.modal {
  background: #fff;
  border: 2px solid #000;
  padding: 24px;
  max-width: 720px;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
}

.progress-info {
  font-size: 0.875rem;
  font-weight: 600;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.levels-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 6px;
  overflow-y: auto;
  padding: 4px;
  flex: 1;
}

.level-cell {
  border: 2px solid #000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.15s;
  padding: 4px;
  min-height: 60px;
  text-align: center;
}

.level-cell:hover:not(.locked) {
  background: #f0f0f0;
}

.level-cell.completed {
  background: #e8e8e8;
}

.level-cell.locked {
  background: #fafafa;
  opacity: 0.4;
  cursor: not-allowed;
}

.level-main {
  display: flex;
  align-items: center;
  gap: 4px;
  line-height: 1;
}

.level-number {
  font-size: 0.875rem;
  font-weight: 700;
}

.level-check {
  color: #000;
  font-weight: 700;
}

.level-lock {
  color: #999;
  font-size: 0.625rem;
}

.level-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  font-size: 0.625rem;
  line-height: 1;
  margin-top: 2px;
}

.level-size {
  color: #666;
}

.level-stars {
  color: #000;
  font-weight: 700;
}

.level-time {
  font-size: 0.625rem;
  color: #666;
  margin-top: 2px;
  line-height: 1;
}

.assist-mark {
  color: #ff9800;
  font-weight: 700;
}

.modal-actions {
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}

@media (max-width: 600px) {
  .levels-grid {
    grid-template-columns: repeat(5, 1fr);
  }
  
  .level-cell {
    min-height: 50px;
    padding: 2px;
  }
  
  .modal {
    padding: 16px;
    max-height: 90vh;
  }
}
</style>

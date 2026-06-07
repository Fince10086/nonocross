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
  puzzleBank: { type: Array, default: () => [] },
})

const emit = defineEmits(['selectLevel', 'close'])

const LEVELS_PER_PAGE = 200
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
  const maxButtons = 4
  let start = Math.max(1, currentPage.value - Math.floor(maxButtons / 2))
  let end = Math.min(totalPages.value, start + maxButtons - 1)

  if (end - start + 1 < maxButtons) {
    start = Math.max(1, end - maxButtons + 1)
  }

  for (let i = start; i <= end; i++) {
    buttons.push(i)
  }
  return buttons
})

function formatLevelStars(stars) {
  return stars ? '★' + stars : ''
}

function getLevelSolution(level) {
  const info = getLevelInfo(level)
  if (!info || !info.puzzleId) return null
  const puzzle = props.puzzleBank.find(p => `${p.size}-${p.id}` === info.puzzleId)
  return puzzle ? puzzle.solution : null
}
</script>

<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal level-modal">
      <div class="modal-header">
        <h3 class="modal-title">{{ t('levels') }}</h3>
        <div class="progress-info">
          <span>{{ t('completedLabel') }}: {{ completedCount }}/2700</span>
        </div>
      </div>

      <!-- 关卡网格 -->
      <div class="levels-grid thin-scrollbar">
        <div
          v-for="level in pageLevels"
          :key="level"
          class="level-cell"
          :class="{
            completed: isCompleted(level),
            unlocked: isUnlocked(level) && !isCompleted(level),
            locked: !isUnlocked(level),
          }"
          @click="handleSelect(level)"
        >
          <!-- 已完成关卡的图案背景 -->
          <div
            v-if="isCompleted(level)"
            class="level-pattern"
            :style="{
              gridTemplateColumns: 'repeat(' + (getLevelSolution(level)?.length || 0) + ', 1fr)',
              gridTemplateRows: 'repeat(' + (getLevelSolution(level)?.length || 0) + ', 1fr)',
            }"
          >
            <template v-if="getLevelSolution(level)">
              <div
                v-for="(row, r) in getLevelSolution(level)"
                :key="'r'+r"
                class="pattern-row"
              >
                <div
                  v-for="(cell, c) in row"
                  :key="'c'+c"
                  class="pattern-cell"
                  :class="{ filled: cell === 1 }"
                />
              </div>
            </template>
          </div>

          <div class="level-main">
            <span class="level-number">{{ level }}</span>
            <span v-if="!isUnlocked(level)" class="level-lock">●</span>
          </div>
          <div v-if="getLevelInfo(level)" class="level-meta">
            <span class="level-size">{{ getLevelInfo(level).size }}×{{ getLevelInfo(level).size }}</span>
            <span class="level-stars">{{ formatLevelStars(getLevelInfo(level).stars) }}</span>
          </div>
          <div v-if="isCompleted(level)" class="level-record">
            ✓ {{ formatTime(getRecord(level).time) }}
            <span v-if="getRecord(level).assisted" class="assist-mark">*</span>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <div class="btn-group">
          <button class="btn btn-icon" @click="prevPage" :disabled="currentPage === 1">&lt;</button>
          <button
            v-for="page in pageButtons"
            :key="page"
            class="btn btn-icon"
            :class="{ active: page === currentPage }"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
          <button class="btn btn-icon" @click="nextPage" :disabled="currentPage === totalPages">&gt;</button>
        </div>
        <button class="btn" @click="$emit('close')">{{ t('close') }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.level-modal {
  max-width: 720px;
  width: 100%;
  max-height: 85vh;
  gap: 12px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.progress-info {
  font-size: 0.875rem;
  font-weight: 600;
}

.levels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 6px;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 4px;
  flex: 1;
}

.level-cell {
  border: 2px solid #000;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.15s;
  padding: 4px;
  aspect-ratio: 1;
  text-align: center;
  position: relative;
}

.level-cell:hover:not(.locked) {
  background: #f0f0f0;
}

.level-cell.completed {
  border-color: #888;
  opacity: 0.8;
}

.level-cell.locked {
  background: #fafafa;
  opacity: 0.4;
  cursor: not-allowed;
}

.level-main {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  line-height: 1;
}

.level-number {
  font-size: 0.875rem;
  font-weight: 700;
}

.level-lock {
  position: absolute;
  left: 100%;
  margin-left: 2px;
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

.level-record {
  font-size: 0.625rem;
  color: #388e3c;
  font-weight: 600;
  margin-top: 2px;
  line-height: 1;
}

.assist-mark {
  color: #ff9800;
  font-weight: 700;
}

.level-pattern {
  position: absolute;
  inset: 0px;
  display: grid;
  opacity: 0.25;
  pointer-events: none;
  z-index: 0;
}

.pattern-row {
  display: contents;
}

.pattern-cell {
  width: 100%;
  height: 100%;
}

.pattern-cell.filled {
  background: #bbb;
  border-radius: 0.5px;
}

.level-main,
.level-meta,
.level-record {
  position: relative;
  z-index: 1;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  gap: 12px;
}
</style>

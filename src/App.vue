<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { solution, rowHints, colHints } from './puzzle.js'

const SIZE = 10

const grid = ref(Array.from({ length: SIZE }, () => Array(SIZE).fill(0)))
// 0 = empty, 1 = filled, 2 = X
const mode = ref('fill') // 'fill' or 'x'
const history = ref([])
const seconds = ref(0)
const isComplete = ref(false)
const timerInterval = ref(null)
const isRunning = ref(false)

function startTimer() {
  if (!isRunning.value && !isComplete.value) {
    isRunning.value = true
    timerInterval.value = setInterval(() => {
      seconds.value++
    }, 1000)
  }
}

function stopTimer() {
  clearInterval(timerInterval.value)
  isRunning.value = false
}

function pushHistory() {
  history.value.push(grid.value.map(row => [...row]))
  if (history.value.length > 100) {
    history.value.shift()
  }
}

function toggleMode(newMode) {
  mode.value = newMode
}

function cellClick(r, c) {
  if (isComplete.value) return
  startTimer()
  pushHistory()
  if (mode.value === 'fill') {
    grid.value[r][c] = grid.value[r][c] === 1 ? 0 : 1
  } else {
    grid.value[r][c] = grid.value[r][c] === 2 ? 0 : 2
  }
  checkComplete()
}

function cellRightClick(e, r, c) {
  e.preventDefault()
  if (isComplete.value) return
  startTimer()
  pushHistory()
  grid.value[r][c] = grid.value[r][c] === 2 ? 0 : 2
  checkComplete()
}

function undo() {
  if (history.value.length === 0) return
  grid.value = history.value.pop()
}

function restart() {
  stopTimer()
  seconds.value = 0
  grid.value = Array.from({ length: SIZE }, () => Array(SIZE).fill(0))
  history.value = []
  isComplete.value = false
}

function checkComplete() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const expected = solution[r][c]
      const actual = grid.value[r][c]
      if (expected === 1 && actual !== 1) return
      if (expected === 0 && actual === 1) return
    }
  }
  isComplete.value = true
  stopTimer()
}

const formattedTime = computed(() => {
  const m = Math.floor(seconds.value / 60).toString().padStart(2, '0')
  const s = (seconds.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

onUnmounted(() => {
  stopTimer()
})
</script>

<template>
  <div class="app">
    <h1 class="title">NONOGRAM</h1>

    <div class="toolbar">
      <div class="timer">{{ formattedTime }}</div>
      <div class="btn-group">
        <button
          class="mode-btn"
          :class="{ active: mode === 'fill' }"
          @click="toggleMode('fill')"
        >
          Fill
        </button>
        <button
          class="mode-btn"
          :class="{ active: mode === 'x' }"
          @click="toggleMode('x')"
        >
          Mark X
        </button>
      </div>
      <div class="btn-group">
        <button class="action-btn" @click="undo" :disabled="history.length === 0">
          Undo
        </button>
        <button class="action-btn" @click="restart">
          Restart
        </button>
      </div>
    </div>

    <div class="board-wrapper" :class="{ complete: isComplete }">
      <!-- Top-left spacer -->
      <div class="spacer"></div>

      <!-- Column hints -->
      <div class="col-hints">
        <div v-for="(hints, c) in colHints" :key="c" class="col-hint">
          <div v-for="(n, i) in hints" :key="i" class="hint-num">{{ n }}</div>
        </div>
      </div>

      <!-- Row hints -->
      <div class="row-hints">
        <div v-for="(hints, r) in rowHints" :key="r" class="row-hint">
          <span v-for="(n, i) in hints" :key="i" class="hint-num">{{ n }}</span>
        </div>
      </div>

      <!-- Grid -->
      <div class="grid">
        <div v-for="(row, r) in grid" :key="r" class="row">
          <div
            v-for="(cell, c) in row"
            :key="c"
            class="cell"
            :class="{ filled: cell === 1, x: cell === 2 }"
            @click="cellClick(r, c)"
            @contextmenu.prevent="cellRightClick($event, r, c)"
          >
            <span v-if="cell === 2" class="x-mark">X</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isComplete" class="message">
      Completed in {{ formattedTime }}!
    </div>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background: #fff;
  color: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}

.app {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 0.15em;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: center;
}

.timer {
  font-size: 1.25rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  min-width: 60px;
  text-align: center;
}

.btn-group {
  display: flex;
  gap: 0;
  border: 2px solid #000;
}

.mode-btn, .action-btn {
  padding: 8px 16px;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  background: #fff;
  color: #000;
  cursor: pointer;
  transition: background 0.15s;
}

.mode-btn + .mode-btn,
.action-btn + .action-btn {
  border-left: 2px solid #000;
}

.mode-btn.active {
  background: #000;
  color: #fff;
}

.mode-btn:hover:not(.active),
.action-btn:hover:not(:disabled) {
  background: #f0f0f0;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.board-wrapper {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto 1fr;
  border: 2px solid #000;
  user-select: none;
}

.spacer {
  width: 80px;
  height: 80px;
  border-right: 2px solid #000;
  border-bottom: 2px solid #000;
}

.col-hints {
  display: flex;
  border-bottom: 2px solid #000;
}

.col-hint {
  width: 32px;
  height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding-bottom: 4px;
  gap: 2px;
  border-right: 1px solid #ccc;
}

.col-hint:last-child {
  border-right: none;
}

.row-hints {
  display: flex;
  flex-direction: column;
  border-right: 2px solid #000;
}

.row-hint {
  width: 80px;
  height: 32px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding-right: 8px;
  gap: 6px;
  border-bottom: 1px solid #ccc;
}

.row-hint:last-child {
  border-bottom: none;
}

.hint-num {
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1;
}

.grid {
  display: flex;
  flex-direction: column;
}

.row {
  display: flex;
}

.cell {
  width: 32px;
  height: 32px;
  border-right: 1px solid #ccc;
  border-bottom: 1px solid #ccc;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: background 0.1s;
}

.cell:last-child {
  border-right: none;
}

.row:last-child .cell {
  border-bottom: none;
}

.cell:hover:not(.filled):not(.x) {
  background: #f5f5f5;
}

.cell.filled {
  background: #000;
}

.cell.x {
  background: #fff;
}

.x-mark {
  font-size: 1rem;
  font-weight: 700;
  color: #000;
}

.board-wrapper.complete .cell {
  cursor: default;
}

.message {
  font-size: 1.25rem;
  font-weight: 700;
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 480px) {
  .title {
    font-size: 1.5rem;
  }

  .cell {
    width: 28px;
    height: 28px;
  }

  .col-hint {
    width: 28px;
    height: 60px;
  }

  .row-hint {
    width: 60px;
    height: 28px;
  }

  .spacer {
    width: 60px;
    height: 60px;
  }
}
</style>

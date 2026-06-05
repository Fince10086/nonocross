<script setup>
const props = defineProps({
  grid: { type: Array, required: true },
  currentSize: { type: Number, required: true },
  cellSize: { type: String, required: true },
  hintAreaSize: { type: String, required: true },
  currentColHints: { type: Array, default: null },
  currentRowHints: { type: Array, default: null },
  colHintDetermined: { type: Array, default: () => [] },
  rowHintDetermined: { type: Array, default: () => [] },
  isComplete: { type: Boolean, default: false },
  isPaused: { type: Boolean, default: false },
  mode: { type: String, required: true },
})

const emit = defineEmits([
  'cellMouseDown',
  'cellMouseEnter',
  'stopDragging',
  'toggleMode',
  'resume',
])

function onCellMouseDown(e, r, c) {
  emit('cellMouseDown', e, r, c)
}

function onCellMouseEnter(r, c) {
  emit('cellMouseEnter', r, c)
}

function onStopDragging() {
  emit('stopDragging')
}

function onToggleMode(newMode) {
  emit('toggleMode', newMode)
}

function onResume() {
  emit('resume')
}

function isThickBorder(r, c) {
  const thickR = (r + 1) % 5 === 0 && r + 1 < props.currentSize
  const thickC = (c + 1) % 5 === 0 && c + 1 < props.currentSize
  return { thickR, thickC }
}

function cellStyle(r, c) {
  const { thickR, thickC } = isThickBorder(r, c)
  return {
    width: props.cellSize,
    height: props.cellSize,
    borderBottom: thickR ? '2px solid #ccc' : undefined,
    borderRight: thickC ? '2px solid #ccc' : undefined,
  }
}

function spacerStyle() {
  return {
    width: props.hintAreaSize,
    height: props.hintAreaSize,
  }
}

function colHintStyle() {
  return {
    width: props.cellSize,
    height: props.hintAreaSize,
  }
}

function rowHintStyle() {
  return {
    width: props.hintAreaSize,
    height: props.cellSize,
  }
}
</script>

<template>
  <div class="board-wrapper" :class="{ complete: isComplete }">
    <!-- Top-left spacer -->
    <div class="spacer" :style="spacerStyle()">
      <div
        class="mode-top"
        :class="{ active: mode === 'fill' }"
        @click="onToggleMode('fill')"
      >
        Fill
      </div>
      <div
        class="mode-bottom"
        :class="{ active: mode === 'x' }"
        @click="onToggleMode('x')"
      >
        X
      </div>
    </div>

    <!-- Column hints -->
    <div class="col-hints">
      <div
        v-for="(hints, c) in currentColHints"
        :key="c"
        class="col-hint"
        :style="colHintStyle()"
      >
        <div
          v-for="(n, i) in hints"
          :key="i"
          class="hint-num"
          :class="{
            'hint-determined': colHintDetermined[c]?.has(i),
          }"
        >
          {{ n }}
        </div>
      </div>
    </div>

    <!-- Row hints -->
    <div class="row-hints">
      <div
        v-for="(hints, r) in currentRowHints"
        :key="r"
        class="row-hint"
        :style="rowHintStyle()"
      >
        <span
          v-for="(n, i) in hints"
          :key="i"
          class="hint-num"
          :class="{
            'hint-determined': rowHintDetermined[r]?.has(i),
          }"
          >{{ n }}</span
        >
      </div>
    </div>

    <!-- Grid -->
    <div
      class="grid"
      @mouseup="onStopDragging"
      @mouseleave="onStopDragging"
    >
      <div v-for="(row, r) in grid" :key="r" class="row">
        <div
          v-for="(cell, c) in row"
          :key="c"
          class="cell"
          :class="{ filled: cell === 1, x: cell === 2 }"
          :style="cellStyle(r, c)"
          @mousedown.prevent="onCellMouseDown($event, r, c)"
          @mouseenter="onCellMouseEnter(r, c)"
          @contextmenu.prevent
        >
          <span v-if="cell === 2" class="x-mark">✕</span>
        </div>
      </div>
    </div>

    <!-- Pause overlay -->
    <div
      v-if="isPaused"
      class="pause-overlay"
      @click="onResume"
    >
      <span class="pause-text">PAUSED</span>
    </div>
  </div>
</template>

<style scoped>
.board-wrapper {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto 1fr;
  border: 2px solid #000;
  user-select: none;
}

.spacer {
  display: flex;
  flex-direction: column;
  border-right: 2px solid #000;
  border-bottom: 2px solid #000;
  cursor: pointer;
  transition: background-color 0.15s;
}

.mode-top,
.mode-bottom {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.875rem;
  font-weight: 700;
  color: #000;
  transition: background-color 0.15s, color 0.15s;
  user-select: none;
}

.mode-top {
  border-bottom: 1px solid #000;
}

.mode-top.active {
  background-color: #000;
  color: #fff;
}

.mode-bottom.active {
  background-color: #b71c1c;
  color: #fff;
}

.mode-top:hover:not(.active),
.mode-bottom:hover:not(.active) {
  background-color: rgba(0, 0, 0, 0.05);
}

.col-hints {
  display: flex;
  border-bottom: 2px solid #000;
}

.col-hint {
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

.hint-determined {
  color: #bbb;
}

.grid {
  display: flex;
  flex-direction: column;
}

.row {
  display: flex;
}

.cell {
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
  font-size: 0.8rem;
  font-weight: 700;
  color: #b71c1c;
}

.pause-overlay {
  position: absolute;
  inset: 0;
  background: rgba(200, 200, 200, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  cursor: pointer;
}

.pause-text {
  font-size: 2rem;
  font-weight: 700;
  color: #000;
  letter-spacing: 0.2em;
}

.board-wrapper.complete .cell {
  cursor: default;
}
</style>

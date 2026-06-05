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
  'cellTouchStart',
  'cellTouchMove',
  'stopDragging',
  'toggleMode',
  'resume',
])

/**
 * 判断单元格是否需要加粗边框（每5格一组）
 * @param {number} r - 行索引
 * @param {number} c - 列索引
 * @returns {{thickR: boolean, thickC: boolean}} 边框加粗标记
 */
function isThickBorder(r, c) {
  const thickR = (r + 1) % 5 === 0 && r + 1 < props.currentSize
  const thickC = (c + 1) % 5 === 0 && c + 1 < props.currentSize
  return { thickR, thickC }
}

/**
 * 获取单元格样式
 * @param {number} r - 行索引
 * @param {number} c - 列索引
 * @returns {object} CSS 样式对象
 */
function cellStyle(r, c) {
  const { thickR, thickC } = isThickBorder(r, c)
  return {
    width: props.cellSize,
    height: props.cellSize,
    borderBottom: thickR ? '2px solid #ccc' : undefined,
    borderRight: thickC ? '2px solid #ccc' : undefined,
  }
}

/**
 * 获取列提示区样式
 * @returns {object} CSS 样式对象
 */
function colHintStyle() {
  return {
    width: props.cellSize,
    height: props.hintAreaSize,
  }
}

/**
 * 获取行提示区样式
 * @returns {object} CSS 样式对象
 */
function rowHintStyle() {
  return {
    width: props.hintAreaSize,
    height: props.cellSize,
  }
}

/**
 * 处理单元格鼠标按下
 * @param {MouseEvent} e - 鼠标事件
 * @param {number} r - 行索引
 * @param {number} c - 列索引
 */
function onCellMouseDown(e, r, c) {
  emit('cellMouseDown', e, r, c)
}

/**
 * 处理单元格鼠标移入
 * @param {number} r - 行索引
 * @param {number} c - 列索引
 */
function onCellMouseEnter(r, c) {
  emit('cellMouseEnter', r, c)
}

/**
 * 处理单元格触摸开始
 * @param {TouchEvent} e - 触摸事件
 * @param {number} r - 行索引
 * @param {number} c - 列索引
 */
function onCellTouchStart(e, r, c) {
  emit('cellTouchStart', e, r, c)
}

/**
 * 处理触摸移动
 * @param {TouchEvent} e - 触摸事件
 */
function onCellTouchMove(e) {
  emit('cellTouchMove', e)
}

/**
 * 停止拖拽
 */
function onStopDragging() {
  emit('stopDragging')
}

/**
 * 切换操作模式
 * @param {string} newMode - 新模式
 */
function onToggleMode(newMode) {
  emit('toggleMode', newMode)
}

/**
 * 恢复计时
 */
function onResume() {
  emit('resume')
}
</script>

<template>
  <div
    class="board-wrapper"
    :class="{ complete: isComplete }"
    @touchend="onStopDragging"
    @touchcancel="onStopDragging"
  >
    <!-- 左上角间隔区（模式切换） -->
    <div class="spacer">
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

    <!-- 列提示区 -->
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

    <!-- 行提示区 -->
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

    <!-- 游戏网格 -->
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
          :data-cell="true"
          :data-row="r"
          :data-col="c"
          @mousedown.prevent="onCellMouseDown($event, r, c)"
          @mouseenter="onCellMouseEnter(r, c)"
          @touchstart.prevent="onCellTouchStart($event, r, c)"
          @touchmove.prevent="onCellTouchMove($event)"
          @contextmenu.prevent
        >
          <span v-if="cell === 2" class="x-mark">✕</span>
        </div>
      </div>
    </div>

    <!-- 暂停遮罩层 -->
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
  touch-action: none; /* 防止触摸时页面滚动 */
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
  /* 触摸设备上的优化 */
  -webkit-tap-highlight-color: transparent;
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

@media (max-width: 600px) {
  .pause-text {
    font-size: 1.5rem;
  }
}
</style>

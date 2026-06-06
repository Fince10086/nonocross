<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { CELL_SIZE, HINT_AREA_SIZE } from '../constants.js'
import { t } from '../i18n.js'

const props = defineProps({
  grid: { type: Array, required: true },
  currentSize: { type: Number, required: true },
  currentColHints: { type: Array, default: null },
  currentRowHints: { type: Array, default: null },
  colHintDetermined: { type: Array, default: () => [] },
  rowHintDetermined: { type: Array, default: () => [] },
  rowHintConflict: { type: Array, default: () => [] },
  colHintConflict: { type: Array, default: () => [] },
  rowHintDerivable: { type: Array, default: () => [] },
  colHintDerivable: { type: Array, default: () => [] },
  isComplete: { type: Boolean, default: false },
  isPaused: { type: Boolean, default: false },
  mode: { type: String, required: true },
  selectedCell: { type: Object, default: null },
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

// 动态计算的尺寸
const cellSize = ref('32px')
const hintAreaSize = ref('80px')

// 是否启用紧凑模式（hint 区域较小时才缩小字体和间距）
const isCompact = ref(false)

/**
 * 根据视口宽度计算棋盘尺寸
 * 小屏幕下自动缩小，但保证最小 16px 单元格
 */
function updateSize() {
  const viewportWidth = window.innerWidth
  const padding = viewportWidth < 600 ? 16 : 40
  const availableWidth = viewportWidth - padding

  // 基础尺寸
  const baseCell = parseInt(CELL_SIZE[props.currentSize] || CELL_SIZE[10], 10)
  const baseHint = parseInt(HINT_AREA_SIZE[props.currentSize] || HINT_AREA_SIZE[10], 10)

  const totalOriginal = baseHint + props.currentSize * baseCell
  const scale = availableWidth / totalOriginal

  if (scale >= 1) {
    // 屏幕足够大，使用原始尺寸
    cellSize.value = `${baseCell}px`
    hintAreaSize.value = `${baseHint}px`
    isCompact.value = false
  } else {
    // 需要缩小，但保证单元格最小 16px，hintArea 最小 55px
    const newCell = Math.max(16, Math.floor(baseCell * scale))
    const newHint = Math.max(55, Math.floor(baseHint * scale))
    cellSize.value = `${newCell}px`
    hintAreaSize.value = `${newHint}px`
    // 只有当 hint 区域被显著压缩时才启用紧凑样式
    isCompact.value = newHint < 70
  }
}

// 尺寸变化时重新计算
watch(() => props.currentSize, updateSize)

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
    width: cellSize.value,
    height: cellSize.value,
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
    width: cellSize.value,
    height: hintAreaSize.value,
  }
}

/**
 * 获取行提示区样式
 * @returns {object} CSS 样式对象
 */
function rowHintStyle() {
  return {
    width: hintAreaSize.value,
    height: cellSize.value,
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

// 触摸长按状态
const touchPress = ref(null)
const LONG_PRESS_DURATION = 300
const MOVE_THRESHOLD = 10

/**
 * 处理单元格触摸开始
 * 启动长按检测：400ms 内未移动则切换模式
 * @param {TouchEvent} e - 触摸事件
 * @param {number} r - 行索引
 * @param {number} c - 列索引
 */
function onCellTouchStart(e, r, c) {
  if (props.isComplete || props.isPaused) return

  const touch = e.touches[0]
  touchPress.value = {
    r, c,
    startX: touch.clientX,
    startY: touch.clientY,
    timer: setTimeout(() => {
      // 长按触发：切换模式并填充当前格
      touchPress.value = null
      emit('toggleMode', props.mode === 'fill' ? 'x' : 'fill')
      emit('cellTouchStart', e, r, c)
    }, LONG_PRESS_DURATION),
  }
}

/**
 * 处理触摸移动
 * 移动超过阈值时取消长按，开始拖拽
 * @param {TouchEvent} e - 触摸事件
 */
function onCellTouchMove(e) {
  if (!touchPress.value) {
    // 正常拖拽中，直接转发
    emit('cellTouchMove', e)
    return
  }

  const touch = e.touches[0]
  const dx = touch.clientX - touchPress.value.startX
  const dy = touch.clientY - touchPress.value.startY

  // 移动超过阈值：取消长按，开始拖拽
  if (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD) {
    clearTimeout(touchPress.value.timer)
    const { r, c } = touchPress.value
    touchPress.value = null
    // 开始拖拽
    emit('cellTouchStart', e, r, c)
  }

  // 已经开始拖拽，转发 touchmove
  if (!touchPress.value) {
    emit('cellTouchMove', e)
  }
}

/**
 * 处理触摸结束
 * 短按时填充一个格子
 * @param {TouchEvent} e - 触摸事件
 */
function onCellTouchEnd(e) {
  if (!touchPress.value) return

  // 短按：填充一个格子
  clearTimeout(touchPress.value.timer)
  const { r, c } = touchPress.value
  touchPress.value = null
  emit('cellTouchStart', e, r, c)
  emit('stopDragging')
}

/**
 * 停止拖拽
 */
function onStopDragging() {
  // 清理长按状态
  if (touchPress.value) {
    clearTimeout(touchPress.value.timer)
    touchPress.value = null
  }
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

onMounted(() => {
  updateSize()
  window.addEventListener('resize', updateSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateSize)
})

/**
 * 计算统一的 hint 字体大小
 * 根据 hint 区域尺寸和所有提示中数字最多的那个，
 * 动态调整到 [0.6rem, 1.0rem] 范围内，不超出边框
 */
const hintFontSize = computed(() => {
  if (!props.currentColHints || !props.currentRowHints) return 0.75

  const maxColCount = Math.max(0, ...props.currentColHints.map((h) => h.length))
  const maxRowCount = Math.max(0, ...props.currentRowHints.map((h) => h.length))
  const maxCount = Math.max(maxColCount, maxRowCount)

  if (maxCount === 0) return 1

  const hintH = parseInt(hintAreaSize.value, 10)

  // 列提示（垂直堆叠）
  const colGap = isCompact.value ? 1 : 2
  const colPadding = isCompact.value ? 2 : 4
  const colAvailable = hintH - colPadding
  const colFontSize =
    maxColCount > 0
      ? (colAvailable - (maxColCount - 1) * colGap) / maxColCount
      : Infinity

  // 行提示（水平排列），数字平均宽度系数 0.7
  const rowGap = isCompact.value ? 3 : 6
  const rowPadding = isCompact.value ? 4 : 8
  const rowAvailable = hintH - rowPadding
  const rowFontSize =
    maxRowCount > 0
      ? (rowAvailable - (maxRowCount - 1) * rowGap) / (maxRowCount * 0.7)
      : Infinity

  const fontSizePx = Math.min(colFontSize, rowFontSize)
  const fontSizeRem = fontSizePx / 16

  let finalSize = Math.max(0.6, Math.min(1.0, fontSizeRem))
  // 缩小时额外减小 0.05rem
  if (finalSize < 1.0) {
    finalSize = Math.max(0.6, finalSize - 0.05)
  }
  return finalSize
})

/**
 * 棋盘 CSS 变量
 */
const boardVars = computed(() => {
  return {
    '--hint-font-size': `${hintFontSize.value}rem`,
  }
})
</script>

<template>
  <div
    class="board-wrapper"
    :class="{ complete: isComplete, 'compact-hints': isCompact }"
    :style="boardVars"
    @touchcancel="onStopDragging"
  >
    <!-- 左上角间隔区（模式切换） -->
    <div
      class="spacer"
      :class="{ paused: isPaused }"
      @click="onToggleMode(props.mode === 'fill' ? 'x' : 'fill')"
    >
      <div class="mode-top" :class="{ active: mode === 'fill' }">{{ t('fill') }}</div>
      <div class="mode-bottom" :class="{ active: mode === 'x' }">{{ t('markX') }}</div>
    </div>

    <!-- 列提示区 -->
    <div class="col-hints" :class="{ paused: isPaused }">
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
            'hint-conflict': colHintConflict[c],
            'hint-derivable': !colHintConflict[c] && colHintDerivable[c],
          }"
        >
          {{ n }}
        </div>
      </div>
    </div>

    <!-- 行提示区 -->
    <div class="row-hints" :class="{ paused: isPaused }">
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
            'hint-conflict': rowHintConflict[r],
            'hint-derivable': !rowHintConflict[r] && rowHintDerivable[r],
          }"
          >{{ n }}</span
        >
      </div>
    </div>

    <!-- 游戏网格 -->
    <div
      class="grid"
      :class="{ paused: isPaused }"
      @mouseup="onStopDragging"
      @mouseleave="onStopDragging"
    >
      <div v-for="(row, r) in grid" :key="r" class="row">
        <div
          v-for="(cell, c) in row"
          :key="c"
          class="cell"
          :class="{
            filled: cell === 1,
            x: cell === 2,
            selected: selectedCell?.r === r && selectedCell?.c === c,
          }"
          :style="cellStyle(r, c)"
          :data-cell="true"
          :data-row="r"
          :data-col="c"
          @mousedown.prevent="onCellMouseDown($event, r, c)"
          @mouseenter="onCellMouseEnter(r, c)"
          @touchstart.prevent="onCellTouchStart($event, r, c)"
          @touchmove.prevent="onCellTouchMove($event)"
          @touchend.prevent="onCellTouchEnd($event)"
          @contextmenu.prevent
        >
          <span v-if="cell === 2" class="x-mark">✕</span>
        </div>
      </div>

      <!-- 暂停遮罩层（仅覆盖 grid 区域，半透明） -->
      <div
        v-if="isPaused"
        class="pause-overlay"
        @click="onResume"
      >
        <span class="pause-text">{{ t('paused') }}</span>
      </div>
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
  transition: background-color 0.15s ease;
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
  transition: background-color 0.15s ease;
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
  font-size: var(--hint-font-size);
  font-weight: 600;
  line-height: 1;
  transition: opacity 0.15s ease, color 0.15s ease;
}

.hint-determined {
  opacity: 0.35;
}

.hint-conflict {
  color: #c62828;
  opacity: 1;
}

.hint-derivable {
  color: #1976d2;
}

.grid {
  display: flex;
  flex-direction: column;
  position: relative;
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

.cell.selected {
  outline: 2px solid #1976d2;
  outline-offset: -2px;
  position: relative;
  z-index: 1;
}

.cell.selected.filled {
  outline-color: #42a5f5;
}

.x-mark {
  font-size: 0.8rem;
  font-weight: 700;
  color: #b71c1c;
}

.pause-overlay {
  position: absolute;
  inset: 0;
  background: rgba(200, 200, 200, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  cursor: pointer;
  opacity: 0;
  animation: fadeInPause 0.15s ease forwards;
}

@keyframes fadeInPause {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.pause-text {
  font-size: 2rem;
  font-weight: 700;
  color: #000;
  letter-spacing: 0.2em;
}

/* 暂停时 hints 和 spacer 全灰遮挡 */
.spacer.paused,
.col-hints.paused,
.row-hints.paused {
  background-color: rgb(200, 200, 200) !important;
}

/* 暂停时 spacer 内部所有背景色都被覆盖 */
.spacer.paused .mode-top,
.spacer.paused .mode-bottom,
.spacer.paused .mode-top.active,
.spacer.paused .mode-bottom.active {
  background-color: rgb(200, 200, 200) !important;
  color: transparent !important;
  border-color: rgb(180, 180, 180) !important;
}

/* 暂停时 hints 的文字不可见 */
.col-hints.paused .hint-num,
.row-hints.paused .hint-num {
  opacity: 0;
}

.board-wrapper.complete .cell {
  cursor: default;
}

/* 紧凑模式：只在 hint 区域被显著压缩时启用 */
.board-wrapper.compact-hints .col-hint {
  gap: 1px;
  padding-bottom: 2px;
}

.board-wrapper.compact-hints .row-hint {
  gap: 3px;
  padding-right: 4px;
}

@media (max-width: 600px) {
  .pause-text {
    font-size: 1.5rem;
  }
}
</style>

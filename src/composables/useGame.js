import { ref, computed } from 'vue'
import {
  getHints,
  fullSettle,
  sweepsToStars,
  decodePuzzle,
  encodePuzzle,
} from '../solver.js'
import { getDeterminedHints } from '../hints.js'
import { formatStars } from '../utils.js'
import { generatePuzzleAsync } from '../generator.js'
import {
  CELL_STATE,
  MODE,
  MAX_HISTORY,
  MOUSE_BUTTON,
  GRID_SIZE,
  CELL_SIZE,
  HINT_AREA_SIZE,
  STAR_RATINGS,
} from '../constants.js'

/**
 * 游戏核心逻辑 Composable
 * 管理棋盘状态、用户交互、谜题加载和导入导出
 * @param {ReturnType<typeof import('./useTimer.js').useTimer>} timer - 计时器实例
 * @param {ReturnType<typeof import('./useFavorites.js').useFavorites>} favorites - 收藏实例
 * @returns {object} 游戏状态和操作方法
 */
export function useGame(timer, favorites) {
  const currentSize = ref(GRID_SIZE.MEDIUM)
  const grid = ref([])
  const mode = ref(MODE.FILL)
  const history = ref([])
  const isComplete = ref(false)

  const isDragging = ref(false)
  const dragValue = ref(null)
  const ctrlDown = ref(false)

  const currentSolution = ref(null)
  const currentRowHints = ref(null)
  const currentColHints = ref(null)
  const currentStars = ref(null)
  const currentSweeps = ref(null)
  const isGenerating = ref(false)
  const currentPuzzleId = ref(null)

  const puzzleBank = ref([])
  const puzzleBankLoaded = ref(false)
  const selectedStar = ref(1)

  // 触摸状态追踪
  const touchActiveCell = ref(null)

  // 键盘选中格子
  const selectedCell = ref(null)

  /**
   * 创建空网格
   * @param {number} size - 网格大小
   * @returns {number[][]} 空网格
   */
  function createEmptyGrid(size) {
    return Array.from({ length: size }, () => Array(size).fill(CELL_STATE.EMPTY))
  }

  /**
   * 将游戏网格状态转换为求解器状态
   * @param {number} val - 单元格值
   * @returns {number|null} 求解器状态
   */
  function gridToSolverState(val) {
    if (val === CELL_STATE.FILLED) return 1
    if (val === CELL_STATE.MARKED) return 0
    return null
  }

  // 已确定的行提示（增量更新，避免全量重算）
  const rowHintDetermined = ref([])
  const colHintDetermined = ref([])

  /**
   * 全量初始化已确定提示
   */
  function initHintDetermined() {
    if (!currentRowHints.value || !currentColHints.value) {
      rowHintDetermined.value = []
      colHintDetermined.value = []
      return
    }
    rowHintDetermined.value = currentRowHints.value.map((hints, r) => {
      const state = grid.value[r].map(gridToSolverState)
      return getDeterminedHints(state, hints)
    })
    colHintDetermined.value = currentColHints.value.map((hints, c) => {
      const state = grid.value.map((row) => gridToSolverState(row[c]))
      return getDeterminedHints(state, hints)
    })
  }

  /**
   * 增量更新受影响的行和列的已确定提示
   * @param {number} r - 行索引
   * @param {number} c - 列索引
   */
  function updateHintDetermined(r, c) {
    if (!currentRowHints.value || !currentColHints.value) return
    const newRowHints = [...rowHintDetermined.value]
    const rowState = grid.value[r].map(gridToSolverState)
    newRowHints[r] = getDeterminedHints(rowState, currentRowHints.value[r])
    rowHintDetermined.value = newRowHints

    const newColHints = [...colHintDetermined.value]
    const colState = grid.value.map((row) => gridToSolverState(row[c]))
    newColHints[c] = getDeterminedHints(colState, currentColHints.value[c])
    colHintDetermined.value = newColHints
  }

  // 当前尺寸的所有谜题
  const puzzlesForSize = computed(() => {
    return puzzleBank.value.filter((p) => p.size === currentSize.value)
  })

  // 当前星级筛选后的谜题
  const puzzlesForStar = computed(() => {
    return puzzlesForSize.value.filter((p) => p.stars === selectedStar.value)
  })

  // 可用的星级列表
  const availableStars = computed(() => {
    const stars = new Set(puzzlesForSize.value.map((p) => p.stars))
    return STAR_RATINGS.filter((s) => stars.has(s))
  })

  // 单元格尺寸
  const cellSize = computed(() => {
    return CELL_SIZE[currentSize.value] || CELL_SIZE[GRID_SIZE.LARGE]
  })

  // 提示区尺寸
  const hintAreaSize = computed(() => {
    return HINT_AREA_SIZE[currentSize.value] || HINT_AREA_SIZE[GRID_SIZE.LARGE]
  })

  /**
   * 从谜题库原始行数据解析谜题对象
   * @param {string} line - 原始行数据，格式：id:size:solution:sweeps
   * @returns {object|null} 解析后的谜题对象
   */
  function enrichPuzzle(line) {
    const result = decodePuzzle(line.trim())
    if (!result) return null

    const { id, size, solution, sweeps } = result
    if (!id || sweeps === null || sweeps === undefined) return null

    const rowHints = solution.map((row) => getHints(row))
    const colHints = solution[0].map((_, colIndex) =>
      getHints(solution.map((row) => row[colIndex])),
    )

    const stars = sweepsToStars(sweeps, size)
    const starsText = formatStars(stars)

    return { id, size, solution, rowHints, colHints, sweeps, stars, starsText }
  }

  /**
   * 加载谜题库（按大小分三个文件）
   */
  async function loadPuzzleBank() {
    try {
      const files = ['/puzzles-5.json', '/puzzles-10.json', '/puzzles-15.json']
      const results = await Promise.all(
        files.map(async (file) => {
          const res = await fetch(file)
          if (!res.ok) throw new Error(`HTTP ${res.status} for ${file}`)
          return res.text()
        }),
      )

      const allLines = []
      for (const text of results) {
        const lines = text
          .trim()
          .split('\n')
          .filter((line) => line.trim())
        allLines.push(...lines)
      }

      puzzleBank.value = allLines.map(enrichPuzzle).filter(Boolean)
      puzzleBankLoaded.value = true
    } catch (e) {
      console.error('加载谜题库失败:', e)
      puzzleBank.value = []
      puzzleBankLoaded.value = true
    }
  }

  /**
   * 加载指定谜题
   * @param {object} puzzle - 谜题对象
   */
  function loadPuzzle(puzzle) {
    currentSolution.value = puzzle.solution
    currentRowHints.value = puzzle.rowHints
    currentColHints.value = puzzle.colHints
    currentStars.value = puzzle.starsText || null
    currentSweeps.value = puzzle.sweeps || null
    currentPuzzleId.value = puzzle.id || null
    restart()
  }

  /**
   * 从谜题列表中随机选择一道
   * @param {object[]} puzzles - 谜题列表
   * @returns {object|null} 随机谜题
   */
  function pickRandomPuzzle(puzzles) {
    if (!puzzles || puzzles.length === 0) return null
    const idx = Math.floor(Math.random() * puzzles.length)
    return puzzles[idx]
  }

  /**
   * 重新开始当前谜题
   */
  function restart() {
    timer.stop()
    timer.reset()
    grid.value = createEmptyGrid(currentSize.value)
    history.value = []
    isComplete.value = false
    isDragging.value = false
    dragValue.value = null
    touchActiveCell.value = null
    selectedCell.value = null
    initHintDetermined()
  }

  /**
   * 保存当前状态到历史记录
   */
  function pushHistory() {
    history.value.push(grid.value.map((row) => [...row]))
    if (history.value.length > MAX_HISTORY) {
      history.value.shift()
    }
  }

  /**
   * 撤销上一步操作
   */
  function undo() {
    if (history.value.length === 0) return
    grid.value = history.value.pop()
    initHintDetermined()
  }

  /**
   * 切换操作模式
   * @param {string} newMode - 新模式
   */
  function toggleMode(newMode) {
    mode.value = newMode
  }

  /**
   * 根据鼠标按键获取目标值
   * @param {number} button - 鼠标按键码
   * @returns {number} 目标单元格值
   */
  function getTargetValue(button) {
    const effectiveMode =
      button === MOUSE_BUTTON.LEFT
        ? mode.value
        : mode.value === MODE.FILL
          ? MODE.X
          : MODE.FILL
    return effectiveMode === MODE.FILL ? CELL_STATE.FILLED : CELL_STATE.MARKED
  }

  /**
   * 处理单元格鼠标按下事件
   * @param {MouseEvent} e - 鼠标事件
   * @param {number} r - 行索引
   * @param {number} c - 列索引
   */
  function cellMouseDown(e, r, c) {
    if (isComplete.value) return
    if (timer.isPaused.value) {
      timer.resume()
      return
    }
    if (e.button !== MOUSE_BUTTON.LEFT && e.button !== MOUSE_BUTTON.RIGHT) return
    e.preventDefault()
    timer.start()
    pushHistory()

    const targetVal = getTargetValue(e.button)
    const currentVal = grid.value[r][c]

    dragValue.value = currentVal === targetVal ? CELL_STATE.EMPTY : targetVal
    grid.value[r][c] = dragValue.value
    isDragging.value = true
    updateHintDetermined(r, c)
    checkComplete()
  }

  /**
   * 处理单元格鼠标移入事件
   * @param {number} r - 行索引
   * @param {number} c - 列索引
   */
  function cellMouseEnter(r, c) {
    if (!isDragging.value || isComplete.value) return
    let changed = false
    if (dragValue.value === CELL_STATE.EMPTY) {
      if (grid.value[r][c] !== CELL_STATE.EMPTY) {
        grid.value[r][c] = CELL_STATE.EMPTY
        changed = true
      }
    } else if (grid.value[r][c] === CELL_STATE.EMPTY) {
      grid.value[r][c] = dragValue.value
      changed = true
    }
    if (changed) updateHintDetermined(r, c)
  }

  /**
   * 处理单元格触摸开始事件
   * @param {TouchEvent} e - 触摸事件
   * @param {number} r - 行索引
   * @param {number} c - 列索引
   */
  function cellTouchStart(e, r, c) {
    if (isComplete.value) return
    if (timer.isPaused.value) {
      timer.resume()
      return
    }
    e.preventDefault()
    timer.start()
    pushHistory()

    // 单指使用当前模式，双指使用相反模式（与鼠标左右键逻辑一致）
    const isMultiTouch = e.touches.length > 1
    const targetMode = isMultiTouch
      ? (mode.value === MODE.FILL ? MODE.X : MODE.FILL)
      : mode.value
    const targetVal = targetMode === MODE.FILL ? CELL_STATE.FILLED : CELL_STATE.MARKED
    const currentVal = grid.value[r][c]

    dragValue.value = currentVal === targetVal ? CELL_STATE.EMPTY : targetVal
    grid.value[r][c] = dragValue.value
    isDragging.value = true
    touchActiveCell.value = { r, c }
    updateHintDetermined(r, c)
    checkComplete()
  }

  /**
   * 处理触摸移动事件
   * @param {TouchEvent} e - 触摸事件
   */
  function cellTouchMove(e) {
    if (!isDragging.value || isComplete.value) return
    e.preventDefault()

    const touch = e.touches[0]
    if (!touch) return

    const element = document.elementFromPoint(touch.clientX, touch.clientY)
    if (!element) return

    const cell = element.closest('[data-cell]')
    if (!cell) return

    const r = parseInt(cell.dataset.row, 10)
    const c = parseInt(cell.dataset.col, 10)

    if (isNaN(r) || isNaN(c)) return
    if (touchActiveCell.value?.r === r && touchActiveCell.value?.c === c) return

    touchActiveCell.value = { r, c }

    let changed = false
    if (dragValue.value === CELL_STATE.EMPTY) {
      if (grid.value[r][c] !== CELL_STATE.EMPTY) {
        grid.value[r][c] = CELL_STATE.EMPTY
        changed = true
      }
    } else if (grid.value[r][c] === CELL_STATE.EMPTY) {
      grid.value[r][c] = dragValue.value
      changed = true
    }
    if (changed) updateHintDetermined(r, c)
  }

  /**
   * 停止拖拽操作
   */
  function stopDragging() {
    isDragging.value = false
    dragValue.value = null
    touchActiveCell.value = null
  }

  /**
   * 检查谜题是否完成
   */
  function checkComplete() {
    if (!currentSolution.value) return
    for (let r = 0; r < currentSize.value; r++) {
      for (let c = 0; c < currentSize.value; c++) {
        const expected = currentSolution.value[r][c]
        const actual = grid.value[r][c]
        if (expected === 1 && actual !== CELL_STATE.FILLED) return
        if (expected === 0 && actual === CELL_STATE.FILLED) return
      }
    }
    isComplete.value = true
    timer.stop()
    favorites.markCompleted(currentSolution.value, timer.seconds.value)
  }

  /**
   * 生成新谜题
   */
  async function generateNewPuzzle() {
    if (isGenerating.value) return
    isGenerating.value = true
    currentPuzzleId.value = null
    try {
      const puzzle = await generatePuzzleAsync(currentSize.value)
      loadPuzzle(puzzle)
    } catch (e) {
      console.error('生成谜题失败:', e)
    } finally {
      isGenerating.value = false
    }
  }

  /**
   * 选择谜题库中的谜题
   * @param {object} puzzle - 谜题对象
   */
  function selectBankPuzzle(puzzle) {
    loadPuzzle(puzzle)
  }

  /**
   * 从收藏数据恢复游戏状态
   * @param {object} data - 收藏数据对象
   */
  function restoreFromData(data) {
    currentSize.value = data.size
    currentSolution.value = data.solution
    currentRowHints.value = data.rowHints
    currentColHints.value = data.colHints
    currentStars.value = data.starsText
    currentSweeps.value = data.sweeps || null
    currentPuzzleId.value = null

    if (data.isComplete) {
      grid.value = data.solution.map((row) => row.map((cell) => (cell === 1 ? 1 : 0)))
      isComplete.value = true
      timer.stop()
      timer.setTime(data.seconds)
      initHintDetermined()
    } else if (data.grid) {
      grid.value = data.grid.map((row) => [...row])
      isComplete.value = false
      timer.reset()
      timer.setTime(data.seconds)
      history.value = []
      timer.start()
      initHintDetermined()
    } else {
      restart()
    }
  }

  /**
   * 切换网格尺寸
   * @param {number} size - 新尺寸
   */
  function changeSize(size) {
    currentSize.value = size
    restart()
    // 自动选择当前尺寸的第一个可用星级
    const stars = [...new Set(puzzlesForSize.value.map((p) => p.stars))]
    if (stars.length > 0) {
      selectedStar.value = Math.min(...stars)
      const puzzles = puzzlesForStar.value
      const puzzle = pickRandomPuzzle(puzzles)
      if (puzzle) {
        selectBankPuzzle(puzzle)
      } else {
        generateNewPuzzle()
      }
    } else {
      generateNewPuzzle()
    }
  }

  /**
   * 选择星级难度
   * @param {number} star - 星级
   */
  function selectStar(star) {
    selectedStar.value = star
    const puzzles = puzzlesForStar.value
    const puzzle = pickRandomPuzzle(puzzles)
    if (puzzle) {
      selectBankPuzzle(puzzle)
    }
  }

  /**
   * 导入谜题
   * @param {string} code - 谜题编码
   * @returns {{success: boolean, error?: string}} 导入结果
   */
  function importPuzzle(code) {
    const result = decodePuzzle(code.trim())
    if (!result) {
      return { success: false, error: '无效的编码格式' }
    }

    const { size, solution, sweeps: encodedSweeps } = result
    const rowHints = solution.map((row) => getHints(row))
    const colHints = solution[0].map((_, colIndex) =>
      getHints(solution.map((row) => row[colIndex])),
    )

    let sweeps = encodedSweeps
    if (sweeps === null || sweeps === undefined) {
      // 旧格式无 sweeps，重新计算
      const settleResult = fullSettle(rowHints, colHints)
      if (!settleResult.solved) {
        return { success: false, error: '该谜题无法通过逻辑推导求解' }
      }
      sweeps = settleResult.sweeps
    }

    const stars = sweepsToStars(sweeps, size)
    const starsText = formatStars(stars)

    currentSize.value = size
    loadPuzzle({
      solution,
      rowHints,
      colHints,
      sweeps,
      stars,
      starsText,
      id: null,
    })

    return { success: true }
  }

  /**
   * 导出当前谜题
   * @returns {string|null} 谜题编码
   */
  function exportPuzzle() {
    if (!currentSolution.value) return null
    const code = encodePuzzle(currentSolution.value, currentSweeps.value || 0)
    return code
  }

  /**
   * 移动键盘选中格子
   * @param {string} direction - up/down/left/right
   */
  function moveSelectedCell(direction) {
    if (isComplete.value) return
    if (!selectedCell.value) {
      selectedCell.value = { r: 0, c: 0 }
      return
    }
    const size = currentSize.value
    let { r, c } = selectedCell.value
    switch (direction) {
      case 'up': r = (r - 1 + size) % size; break
      case 'down': r = (r + 1) % size; break
      case 'left': c = (c - 1 + size) % size; break
      case 'right': c = (c + 1) % size; break
    }
    selectedCell.value = { r, c }
  }

  /**
   * 在选中格子上执行操作
   * @param {number} targetState - 目标状态
   * @returns {boolean} 是否成功执行
   */
  function actOnSelectedCell(targetState) {
    if (isComplete.value || !selectedCell.value) return false
    const { r, c } = selectedCell.value
    const currentVal = grid.value[r][c]
    // 如果已经是目标状态则清空，否则设置为目标状态
    const newVal = currentVal === targetState ? CELL_STATE.EMPTY : targetState
    pushHistory()
    grid.value[r][c] = newVal
    updateHintDetermined(r, c)
    checkComplete()
    timer.start()
    return true
  }

  /**
   * 统一处理键盘事件
   * @param {KeyboardEvent} e - 键盘事件
   * @param {Function} togglePause - 切换暂停的回调
   */
  function handleKeyDown(e, togglePause) {
    // 忽略输入框中的键盘事件
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
      return
    }

    switch (e.key) {
      case 'Control':
      case 'Meta':
        if (!ctrlDown.value) {
          ctrlDown.value = true
        }
        break

      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault()
        moveSelectedCell('up')
        break

      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault()
        moveSelectedCell('down')
        break

      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault()
        moveSelectedCell('left')
        break

      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault()
        moveSelectedCell('right')
        break

      case ' ':
        e.preventDefault()
        if (timer.isPaused.value) {
          timer.resume()
        } else if (!isComplete.value) {
          actOnSelectedCell(mode.value === MODE.FILL ? CELL_STATE.FILLED : CELL_STATE.MARKED)
        }
        break

      case 'f':
      case 'F':
        e.preventDefault()
        actOnSelectedCell(CELL_STATE.FILLED)
        break

      case 'x':
      case 'X':
        e.preventDefault()
        actOnSelectedCell(CELL_STATE.MARKED)
        break

      case 'p':
      case 'P':
        e.preventDefault()
        togglePause()
        break

      case 'z':
      case 'Z':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          undo()
        }
        break

      case 'r':
      case 'R':
        e.preventDefault()
        restart()
        break
    }
  }

  /**
   * 处理键盘释放事件
   * @param {KeyboardEvent} e - 键盘事件
   */
  function onKeyUp(e) {
    if (e.key === 'Control' || e.key === 'Meta') {
      if (ctrlDown.value) {
        ctrlDown.value = false
        mode.value = mode.value === MODE.FILL ? MODE.X : MODE.FILL
      }
    }
  }

  // 初始化
  grid.value = createEmptyGrid(currentSize.value)

  return {
    // 状态
    currentSize,
    grid,
    mode,
    history,
    isComplete,
    isDragging,
    ctrlDown,
    currentSolution,
    currentRowHints,
    currentColHints,
    currentStars,
    currentSweeps,
    isGenerating,
    currentPuzzleId,
    puzzleBank,
    puzzleBankLoaded,
    selectedStar,
    selectedCell,

    // 计算属性
    puzzlesForSize,
    puzzlesForStar,
    availableStars,
    rowHintDetermined,
    colHintDetermined,
    cellSize,
    hintAreaSize,

    // 操作方法
    loadPuzzleBank,
    loadPuzzle,
    restart,
    undo,
    toggleMode,
    cellMouseDown,
    cellMouseEnter,
    cellTouchStart,
    cellTouchMove,
    stopDragging,
    checkComplete,
    generateNewPuzzle,
    selectBankPuzzle,
    changeSize,
    selectStar,
    importPuzzle,
    exportPuzzle,
    restoreFromData,
    handleKeyDown,
    onKeyUp,
  }
}

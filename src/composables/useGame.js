import { ref, computed, watch } from 'vue'
import {
  getHints,
  fullSettle,
  sweepsToStars,
  formatStars,
  getDeterminedHints,
  decodePuzzle,
  encodePuzzle,
} from '../solver.js'
import { generatePuzzleAsync } from '../generator.js'

const MODE_FILL = 'fill'
const MODE_X = 'x'
const MAX_HISTORY = 100

export function useGame(timer, favorites) {
  const currentSize = ref(10)
  const grid = ref([])
  const mode = ref(MODE_FILL)
  const history = ref([])
  const isComplete = ref(false)

  const isDragging = ref(false)
  const dragValue = ref(null)
  const ctrlDown = ref(false)

  const currentSolution = ref(null)
  const currentRowHints = ref(null)
  const currentColHints = ref(null)
  const currentStars = ref(null)
  const isGenerating = ref(false)
  const currentPuzzleId = ref(null)

  const puzzleBank = ref([])
  const puzzleBankLoaded = ref(false)
  const selectedStar = ref(1)

  function createEmptyGrid(size) {
    return Array.from({ length: size }, () => Array(size).fill(0))
  }

  function gridToSolverState(val) {
    if (val === 1) return 1
    if (val === 2) return 0
    return null
  }

  const rowHintDetermined = computed(() => {
    if (!currentRowHints.value) return []
    return currentRowHints.value.map((hints, r) => {
      const state = grid.value[r].map(gridToSolverState)
      return getDeterminedHints(state, hints)
    })
  })

  const colHintDetermined = computed(() => {
    if (!currentColHints.value) return []
    return currentColHints.value.map((hints, c) => {
      const state = grid.value.map((row) => gridToSolverState(row[c]))
      return getDeterminedHints(state, hints)
    })
  })

  const puzzlesForSize = computed(() => {
    return puzzleBank.value.filter((p) => p.size === currentSize.value)
  })

  const puzzlesForStar = computed(() => {
    return puzzlesForSize.value.filter((p) => p.stars === selectedStar.value)
  })

  const availableStars = computed(() => {
    const stars = new Set(puzzlesForSize.value.map((p) => p.stars))
    return [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].filter((s) => stars.has(s))
  })

  const cellSize = computed(() => {
    if (currentSize.value <= 5) return '40px'
    if (currentSize.value <= 10) return '32px'
    return '24px'
  })

  const hintAreaSize = computed(() => {
    if (currentSize.value <= 5) return '60px'
    if (currentSize.value <= 10) return '80px'
    return '100px'
  })

  function enrichPuzzle(line) {
    const parts = line.split(':')
    if (parts.length !== 4) return null

    const id = parts[0]
    const size = parseInt(parts[1], 10)
    const solutionStr = parts[2]
    const sweeps = parseInt(parts[3], 10)

    if (!size || !solutionStr || solutionStr.length !== size * size) return null

    const solution = []
    for (let r = 0; r < size; r++) {
      const row = []
      for (let c = 0; c < size; c++) {
        const val = parseInt(solutionStr[r * size + c], 10)
        if (val !== 0 && val !== 1) return null
        row.push(val)
      }
      solution.push(row)
    }

    const rowHints = solution.map((row) => getHints(row))
    const colHints = solution[0].map((_, colIndex) =>
      getHints(solution.map((row) => row[colIndex])),
    )

    const stars = sweepsToStars(sweeps, size)
    const starsText = formatStars(stars)

    return { id, size, solution, rowHints, colHints, sweeps, stars, starsText }
  }

  async function loadPuzzleBank() {
    try {
      const res = await fetch('/puzzles.json')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      const lines = text
        .trim()
        .split('\n')
        .filter((line) => line.trim())
      puzzleBank.value = lines.map(enrichPuzzle).filter(Boolean)
      puzzleBankLoaded.value = true
    } catch (e) {
      console.error('Failed to load puzzle bank:', e)
      puzzleBank.value = []
      puzzleBankLoaded.value = true
    }
  }

  function loadPuzzle(puzzle) {
    currentSolution.value = puzzle.solution
    currentRowHints.value = puzzle.rowHints
    currentColHints.value = puzzle.colHints
    currentStars.value = puzzle.starsText || null
    currentPuzzleId.value = puzzle.id || null
    restart()
  }

  function restart() {
    timer.stop()
    timer.reset()
    grid.value = createEmptyGrid(currentSize.value)
    history.value = []
    isComplete.value = false
    isDragging.value = false
    dragValue.value = null
  }

  function pushHistory() {
    history.value.push(grid.value.map((row) => [...row]))
    if (history.value.length > MAX_HISTORY) {
      history.value.shift()
    }
  }

  function undo() {
    if (history.value.length === 0) return
    grid.value = history.value.pop()
  }

  function toggleMode(newMode) {
    mode.value = newMode
  }

  function getTargetValue(button) {
    const effectiveMode =
      button === 0 ? mode.value : mode.value === MODE_FILL ? MODE_X : MODE_FILL
    return effectiveMode === MODE_FILL ? 1 : 2
  }

  function cellMouseDown(e, r, c) {
    if (isComplete.value) return
    if (timer.isPaused.value) {
      timer.resume()
      return
    }
    if (e.button !== 0 && e.button !== 2) return
    e.preventDefault()
    timer.start()
    pushHistory()

    const targetVal = getTargetValue(e.button)
    const currentVal = grid.value[r][c]

    dragValue.value = currentVal === targetVal ? 0 : targetVal
    grid.value[r][c] = dragValue.value
    isDragging.value = true
    checkComplete()
  }

  function cellMouseEnter(r, c) {
    if (!isDragging.value || isComplete.value) return
    if (dragValue.value === 0) {
      grid.value[r][c] = 0
    } else if (grid.value[r][c] === 0) {
      grid.value[r][c] = dragValue.value
    }
  }

  function stopDragging() {
    isDragging.value = false
    dragValue.value = null
  }

  function checkComplete() {
    if (!currentSolution.value) return
    for (let r = 0; r < currentSize.value; r++) {
      for (let c = 0; c < currentSize.value; c++) {
        const expected = currentSolution.value[r][c]
        const actual = grid.value[r][c]
        if (expected === 1 && actual !== 1) return
        if (expected === 0 && actual === 1) return
      }
    }
    isComplete.value = true
    timer.stop()
    favorites.markCompleted(currentSolution.value, timer.seconds.value)
  }

  async function generateNewPuzzle() {
    if (isGenerating.value) return
    isGenerating.value = true
    currentPuzzleId.value = null
    try {
      const puzzle = await generatePuzzleAsync(currentSize.value)
      loadPuzzle(puzzle)
    } catch (e) {
      console.error('Failed to generate puzzle:', e)
    } finally {
      isGenerating.value = false
    }
  }

  function selectBankPuzzle(puzzle) {
    loadPuzzle(puzzle)
  }

  function changeSize(size) {
    currentSize.value = size
    restart()
    // Auto-select first available star for this size
    const stars = [...new Set(puzzlesForSize.value.map((p) => p.stars))]
    if (stars.length > 0) {
      selectedStar.value = Math.min(...stars)
      const puzzles = puzzlesForStar.value
      if (puzzles.length > 0) {
        selectBankPuzzle(puzzles[0])
      } else {
        generateNewPuzzle()
      }
    } else {
      generateNewPuzzle()
    }
  }

  function selectStar(star) {
    selectedStar.value = star
    const puzzles = puzzlesForStar.value
    if (puzzles.length > 0) {
      selectBankPuzzle(puzzles[0])
    }
  }

  function importPuzzle(code) {
    const result = decodePuzzle(code.trim())
    if (!result) {
      return { success: false, error: 'Invalid code format' }
    }

    const { size, solution } = result
    const rowHints = solution.map((row) => getHints(row))
    const colHints = solution[0].map((_, colIndex) =>
      getHints(solution.map((row) => row[colIndex])),
    )

    const { solved, sweeps } = fullSettle(rowHints, colHints)
    if (!solved) {
      return { success: false, error: 'This puzzle is not logically solvable' }
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

  function exportPuzzle() {
    if (!currentSolution.value) return null
    const code = encodePuzzle(currentSolution.value)
    return code
  }

  function onKeyDown(e) {
    if (e.key === 'Control' || e.key === 'Meta') {
      if (!ctrlDown.value) {
        ctrlDown.value = true
      }
    }
  }

  function onKeyUp(e) {
    if (e.key === 'Control' || e.key === 'Meta') {
      if (ctrlDown.value) {
        ctrlDown.value = false
        mode.value = mode.value === MODE_FILL ? MODE_X : MODE_FILL
      }
    }
  }

  // Initialize
  grid.value = createEmptyGrid(currentSize.value)

  return {
    // State
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
    isGenerating,
    currentPuzzleId,
    puzzleBank,
    puzzleBankLoaded,
    selectedStar,

    // Computed
    puzzlesForSize,
    puzzlesForStar,
    availableStars,
    rowHintDetermined,
    colHintDetermined,
    cellSize,
    hintAreaSize,

    // Actions
    loadPuzzleBank,
    loadPuzzle,
    restart,
    undo,
    toggleMode,
    cellMouseDown,
    cellMouseEnter,
    stopDragging,
    checkComplete,
    generateNewPuzzle,
    selectBankPuzzle,
    changeSize,
    selectStar,
    importPuzzle,
    exportPuzzle,
    onKeyDown,
    onKeyUp,
  }
}

/**
 * Nonogram puzzle generator with uniqueness guarantee
 * Runs inside a Web Worker
 */

const SIZE = 10

function getHints(line) {
  const hints = []
  let count = 0
  for (const cell of line) {
    if (cell === 1) {
      count++
    } else {
      if (count > 0) {
        hints.push(count)
        count = 0
      }
    }
  }
  if (count > 0) hints.push(count)
  if (hints.length === 0) hints.push(0)
  return hints
}

function getLinePossibilities(hints, size) {
  const results = []

  function backtrack(pos, hintIdx, current, blocksPlaced) {
    if (hintIdx === hints.length) {
      // Fill remaining with 0
      while (current.length < size) current.push(0)
      results.push([...current])
      return
    }

    const hint = hints[hintIdx]
    const remainingHints = hints.slice(hintIdx)
    const minSpace = remainingHints.reduce((a, b) => a + b, 0) + (remainingHints.length - 1)

    for (let start = pos; start <= size - minSpace; start++) {
      // Place block
      const next = [...current]
      while (next.length < start) next.push(0)
      for (let i = 0; i < hint; i++) next.push(1)

      if (next.length < size) next.push(0)

      backtrack(start + hint + 1, hintIdx + 1, next, blocksPlaced + hint)
    }
  }

  if (hints.length === 1 && hints[0] === 0) {
    results.push(Array(size).fill(0))
  } else {
    backtrack(0, 0, [], 0)
  }

  return results
}

function isPartialColValid(grid, upToRow, colIndex, colHints) {
  const col = []
  for (let i = 0; i <= upToRow; i++) col.push(grid[i][colIndex])

  let hintIdx = 0
  let currentCount = 0
  let inBlock = false

  for (let i = 0; i < col.length; i++) {
    if (col[i] === 1) {
      if (!inBlock) {
        inBlock = true
        currentCount = 1
      } else {
        currentCount++
      }
    } else {
      if (inBlock) {
        if (hintIdx >= colHints.length || currentCount !== colHints[hintIdx]) {
          return false
        }
        hintIdx++
        inBlock = false
        currentCount = 0
      }
    }
  }

  if (inBlock) {
    if (hintIdx >= colHints.length || currentCount > colHints[hintIdx]) {
      return false
    }
  }

  return true
}

function countSolutions(rowHints, colHints) {
  const rowPossibilities = rowHints.map(h => getLinePossibilities(h, SIZE))
  let count = 0

  function backtrack(r, grid) {
    if (count >= 2) return
    if (r === SIZE) {
      count++
      return
    }

    for (const poss of rowPossibilities[r]) {
      grid[r] = poss

      // Check columns up to this row
      let valid = true
      for (let c = 0; c < SIZE; c++) {
        if (!isPartialColValid(grid, r, c, colHints[c])) {
          valid = false
          break
        }
      }

      if (valid) {
        backtrack(r + 1, grid)
      }
    }
  }

  const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0))
  backtrack(0, grid)
  return count
}

function randomGrid() {
  const minCells = Math.ceil(SIZE * SIZE * 0.30)
  const maxCells = Math.floor(SIZE * SIZE * 0.50)
  const target = minCells + Math.floor(Math.random() * (maxCells - minCells + 1))

  const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0))
  const positions = []
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      positions.push([r, c])
    }
  }

  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[positions[i], positions[j]] = [positions[j], positions[i]]
  }

  for (let i = 0; i < target; i++) {
    const [r, c] = positions[i]
    grid[r][c] = 1
  }

  return grid
}

function flipCell(grid, r, c) {
  grid[r][c] = grid[r][c] === 1 ? 0 : 1
}

function generatePuzzle() {
  let solution = randomGrid()
  let rowHints = solution.map(row => getHints(row))
  let colHints = solution[0].map((_, colIndex) =>
    getHints(solution.map(row => row[colIndex]))
  )

  let attempts = 0
  const maxAttempts = 300

  while (attempts < maxAttempts) {
    const solCount = countSolutions(rowHints, colHints)
    if (solCount === 1) {
      return { solution, rowHints, colHints }
    }

    const r = Math.floor(Math.random() * SIZE)
    const c = Math.floor(Math.random() * SIZE)
    flipCell(solution, r, c)

    rowHints = solution.map(row => getHints(row))
    colHints = solution[0].map((_, colIndex) =>
      getHints(solution.map(row => row[colIndex]))
    )

    attempts++
  }

  return generatePuzzle()
}

self.onmessage = function (e) {
  if (e.data.type === 'generate') {
    const puzzle = generatePuzzle()
    self.postMessage({ type: 'result', puzzle })
  }
}

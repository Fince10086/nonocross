/**
 * Shared Nonogram Solver Logic
 * Works in both Browser (Worker) and Node.js environments
 */

export function getHints(line) {
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

export function getLinePossibilities(hints, size) {
  const results = []

  function backtrack(pos, hintIdx, current) {
    if (hintIdx === hints.length) {
      while (current.length < size) current.push(0)
      results.push([...current])
      return
    }

    const hint = hints[hintIdx]
    const remainingHints = hints.slice(hintIdx)
    const minSpace = remainingHints.reduce((a, b) => a + b, 0) + (remainingHints.length - 1)

    for (let start = pos; start <= size - minSpace; start++) {
      const next = [...current]
      while (next.length < start) next.push(0)
      for (let i = 0; i < hint; i++) next.push(1)
      if (next.length < size) next.push(0)
      backtrack(start + hint + 1, hintIdx + 1, next)
    }
  }

  if (hints.length === 1 && hints[0] === 0) {
    results.push(Array(size).fill(0))
  } else {
    backtrack(0, 0, [])
  }

  return results
}

function determineLine(known, hints) {
  const possibilities = getLinePossibilities(hints, known.length)

  const valid = possibilities.filter(p => {
    for (let i = 0; i < known.length; i++) {
      if (known[i] !== null && known[i] !== p[i]) return false
    }
    return true
  })

  if (valid.length === 0) return known

  const result = [...known]
  for (let i = 0; i < known.length; i++) {
    if (known[i] !== null) continue
    const first = valid[0][i]
    if (valid.every(v => v[i] === first)) {
      result[i] = first
    }
  }
  return result
}

export function fullSettle(rowHints, colHints, knownGrid = null) {
  const rows = rowHints.length
  const cols = colHints.length
  const grid = knownGrid
    ? knownGrid.map(row => [...row])
    : Array.from({ length: rows }, () => Array(cols).fill(null))

  let changed = true
  while (changed) {
    changed = false
    // Horizontal sweep
    for (let r = 0; r < rows; r++) {
      const line = grid[r]
      const determined = determineLine(line, rowHints[r])
      for (let c = 0; c < cols; c++) {
        if (determined[c] !== null && grid[r][c] === null) {
          grid[r][c] = determined[c]
          changed = true
        }
      }
    }
    if (!changed) break

    changed = false
    // Vertical sweep
    for (let c = 0; c < cols; c++) {
      const line = []
      for (let r = 0; r < rows; r++) line.push(grid[r][c])
      const determined = determineLine(line, colHints[c])
      for (let r = 0; r < rows; r++) {
        if (determined[r] !== null && grid[r][c] === null) {
          grid[r][c] = determined[r]
          changed = true
        }
      }
    }
  }

  let solved = true
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === null) {
        solved = false
        break
      }
    }
  }

  return { grid, solved }
}

export function countSolutions(rowHints, colHints) {
  const rows = rowHints.length
  const cols = colHints.length
  const rowPossibilities = rowHints.map(h => getLinePossibilities(h, cols))
  let count = 0

  function isPartialColValid(grid, upToRow, colIndex) {
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
          if (hintIdx >= colHints[colIndex].length || currentCount !== colHints[colIndex][hintIdx]) {
            return false
          }
          hintIdx++
          inBlock = false
          currentCount = 0
        }
      }
    }

    if (inBlock) {
      if (hintIdx >= colHints[colIndex].length || currentCount > colHints[colIndex][hintIdx]) {
        return false
      }
    }

    return true
  }

  function backtrack(r, grid) {
    if (count >= 2) return
    if (r === rows) {
      count++
      return
    }

    for (const poss of rowPossibilities[r]) {
      grid[r] = poss

      let valid = true
      for (let c = 0; c < cols; c++) {
        if (!isPartialColValid(grid, r, c)) {
          valid = false
          break
        }
      }

      if (valid) {
        backtrack(r + 1, grid)
      }
    }
  }

  const grid = Array.from({ length: rows }, () => Array(cols).fill(0))
  backtrack(0, grid)
  return count
}

export function randomGrid(size) {
  const total = size * size
  const minCells = Math.ceil(total * 0.30)
  const maxCells = Math.floor(total * 0.50)
  const target = minCells + Math.floor(Math.random() * (maxCells - minCells + 1))

  const grid = Array.from({ length: size }, () => Array(size).fill(0))
  const positions = []
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
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

export function generatePuzzle(size, maxAttempts = 50) {
  let solution = randomGrid(size)
  let rowHints = solution.map(row => getHints(row))
  let colHints = solution[0].map((_, colIndex) =>
    getHints(solution.map(row => row[colIndex]))
  )

  let attempts = 0

  while (attempts < maxAttempts) {
    // Check logic solvability with FullSettle
    const { solved } = fullSettle(rowHints, colHints)

    if (solved) {
      // Verify uniqueness
      const solCount = countSolutions(rowHints, colHints)
      if (solCount === 1) {
        return { solution, rowHints, colHints }
      }
    }

    // Adapt: flip a random cell to improve solvability
    // Prefer white cells (add black) when not solved, or random when solved but multi-solution
    const { grid: settled } = fullSettle(rowHints, colHints)
    const unsolved = []
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (settled[r][c] === null) {
          unsolved.push([r, c])
        }
      }
    }

    if (unsolved.length > 0) {
      // Add a black cell in an unsolved area
      const [r, c] = unsolved[Math.floor(Math.random() * unsolved.length)]
      solution[r][c] = 1
    } else {
      // Solved but multi-solution: flip a random cell
      const r = Math.floor(Math.random() * size)
      const c = Math.floor(Math.random() * size)
      solution[r][c] = solution[r][c] === 1 ? 0 : 1
    }

    rowHints = solution.map(row => getHints(row))
    colHints = solution[0].map((_, colIndex) =>
      getHints(solution.map(row => row[colIndex]))
    )

    attempts++
  }

  // Fallback: return whatever we have (may not be unique)
  return { solution, rowHints, colHints }
}

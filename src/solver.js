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

  let sweeps = 0
  let changed = true
  while (changed) {
    changed = false
    // Horizontal sweep (1 round)
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
    sweeps++
    if (!changed) break

    changed = false
    // Vertical sweep (1 round)
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
    sweeps++
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

  return { grid, solved, sweeps }
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

const starThresholds = {
  5:  [4, 5, 6, 7, 8, 10],
  10: [8, 9, 11, 14, 18, 29],
  15: [11, 15, 18, 21, 28, 37]
}

export function sweepsToStars(sweeps, size) {
  const t = starThresholds[size]
  if (sweeps <= t[0]) return 1
  if (sweeps <= t[1]) return 1.5
  if (sweeps <= t[2]) return 2.5
  if (sweeps <= t[3]) return 3.5
  if (sweeps <= t[4]) return 4.5
  return 5
}

export function formatStars(rating) {
  const full = Math.floor(rating)
  const half = rating % 1 === 0.5
  const empty = 5 - full - (half ? 1 : 0)
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty)
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
    const { solved, sweeps } = fullSettle(rowHints, colHints)

    if (solved) {
      // Verify uniqueness
      const solCount = countSolutions(rowHints, colHints)
      if (solCount === 1) {
        const stars = sweepsToStars(sweeps, size)
        return { solution, rowHints, colHints, sweeps, stars, starsText: formatStars(stars) }
      }
    }

    // Adapt: flip a random cell to improve solvability
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
      const [r, c] = unsolved[Math.floor(Math.random() * unsolved.length)]
      solution[r][c] = 1
    } else {
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

  // Fallback
  const { sweeps } = fullSettle(rowHints, colHints)
  const stars = sweepsToStars(sweeps, size)
  return { solution, rowHints, colHints, sweeps, stars, starsText: formatStars(stars) }
}

export function encodePuzzle(solution) {
  const size = solution.length
  const bits = []
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      bits.push(solution[r][c])
    }
  }

  // Pad to multiple of 6
  while (bits.length % 6 !== 0) {
    bits.push(0)
  }

  const chars = []
  const base64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  for (let i = 0; i < bits.length; i += 6) {
    let val = 0
    for (let j = 0; j < 6; j++) {
      val = (val << 1) | bits[i + j]
    }
    chars.push(base64[val])
  }

  return `${size}:${chars.join('')}`
}

export function decodePuzzle(code) {
  const parts = code.split(':')
  if (parts.length !== 2) return null

  const size = parseInt(parts[0], 10)
  const encoded = parts[1]
  if (!size || !encoded || size < 1) return null

  const base64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  const bits = []

  for (const ch of encoded) {
    const idx = base64.indexOf(ch)
    if (idx === -1) return null
    for (let i = 5; i >= 0; i--) {
      bits.push((idx >> i) & 1)
    }
  }

  const solution = []
  for (let r = 0; r < size; r++) {
    const row = []
    for (let c = 0; c < size; c++) {
      const pos = r * size + c
      row.push(bits[pos] || 0)
    }
    solution.push(row)
  }

  return { size, solution }
}

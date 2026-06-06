/**
 * Nonogram 求解器核心逻辑
 * 支持浏览器（Worker）和 Node.js 环境
 */

/**
 * @typedef {number[][]} Grid - 二维网格，值为 0 或 1
 * @typedef {number[]} Line - 一维数组，值为 0 或 1
 * @typedef {number[]} Hints - 提示数字数组，如 [2, 1, 3]
 * @typedef {number|null[]} KnownLine - 已知状态行，null 表示未知
 */

/**
 * 从一行网格中提取提示数字
 * @param {Line} line - 一行网格数据
 * @returns {Hints} 提示数字数组
 * @example
 * getHints([1,1,0,1,0,1,1,1]) // [2, 1, 3]
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

/**
 * 生成一行所有可能的合法排列
 * @param {Hints} hints - 提示数字
 * @param {number} size - 行长度
 * @returns {Line[]} 所有可能的排列
 */
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

/**
 * 根据已知状态推导一行中可确定的格子
 * @param {KnownLine} known - 已知状态行
 * @param {Hints} hints - 提示数字
 * @returns {KnownLine} 推导后的状态行
 */
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

/**
 * 完整求解一个谜题
 * 通过交替扫描行和列，逐步填充可确定的格子
 * @param {Hints[]} rowHints - 所有行的提示
 * @param {Hints[]} colHints - 所有列的提示
 * @param {KnownLine[]} [knownGrid] - 可选的初始已知网格
 * @returns {{grid: KnownLine[], solved: boolean, sweeps: number}} 求解结果
 */
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
    // 水平扫描（一轮）
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
    // 垂直扫描（一轮）
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

/**
 * 计算谜题的解的数量（用于验证唯一性）
 * 当解数量达到 2 时提前终止
 * @param {Hints[]} rowHints - 所有行的提示
 * @param {Hints[]} colHints - 所有列的提示
 * @returns {number} 解的数量（最多返回 2）
 */
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

    const originalRow = grid[r]

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

    // 恢复原始行状态，避免影响其他分支
    grid[r] = originalRow
  }

  const grid = Array.from({ length: rows }, () => Array(cols).fill(0))
  backtrack(0, grid)
  return count
}

/**
 * 生成随机网格
 * 填充密度在 30%-50% 之间
 * @param {number} size - 网格大小
 * @returns {Grid} 随机网格
 */
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

  // Fisher-Yates 洗牌算法
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

// 难度星级阈值映射
const starThresholds = {
  5:  [3, 4, 5, 6, 7, 8, 9, 10],
  10: [7, 9, 11, 13, 15, 17, 20, 24],
  15: [11, 14, 17, 19, 22, 25, 28, 32]
}

/**
 * 根据求解扫描次数转换为星级难度
 * @param {number} sweeps - 求解扫描次数
 * @param {number} size - 网格大小
 * @returns {number} 星级（1-5，支持半星）
 */
export function sweepsToStars(sweeps, size) {
  const t = starThresholds[size]
  if (sweeps <= t[0]) return 1
  if (sweeps <= t[1]) return 1.5
  if (sweeps <= t[2]) return 2
  if (sweeps <= t[3]) return 2.5
  if (sweeps <= t[4]) return 3
  if (sweeps <= t[5]) return 3.5
  if (sweeps <= t[6]) return 4
  if (sweeps <= t[7]) return 4.5
  return 5
}

/**
 * 获取已确定的提示索引
 * 用于 UI 中灰显已完成的提示数字
 * @param {KnownLine} state - 当前行状态（null=空, 1=已填, 0=X标记）
 * @param {Hints} hints - 提示数字
 * @returns {Set<number>} 已确定提示的索引集合
 */
export function getDeterminedHints(state, hints) {
  const size = state.length

  // 全空行特殊情况
  if (hints.length === 1 && hints[0] === 0) {
    const hasConflict = state.some(s => s === 1)
    if (hasConflict) return new Set()
    return new Set()
  }

  // 获取所有可能的合法排列
  const allPossibilities = getLinePossibilities(hints, size)

  // 过滤与当前状态兼容的排列
  const valid = allPossibilities.filter(p => {
    for (let i = 0; i < size; i++) {
      if (state[i] === null) continue
      if (state[i] !== p[i]) return false
    }
    return true
  })

  // 无合法解 -> 错误阻断
  if (valid.length === 0) return new Set()

  // 收集每个提示在所有合法解中的 [start, end] 位置
  const positions = hints.map(() => [])

  for (const p of valid) {
    let pos = 0
    for (let h = 0; h < hints.length; h++) {
      const hint = hints[h]
      while (pos < size && p[pos] === 0) pos++
      const start = pos
      const end = pos + hint - 1
      positions[h].push([start, end])
      pos = end + 1
      if (pos < size && p[pos] === 0) pos++
    }
  }

  const determined = new Set()

  for (let h = 0; h < hints.length; h++) {
    const posList = positions[h]
    if (posList.length === 0) continue

    const first = posList[0]
    const allSame = posList.every(p => p[0] === first[0] && p[1] === first[1])
    if (!allSame) continue

    let allFilled = true
    for (let i = first[0]; i <= first[1]; i++) {
      if (state[i] !== 1) {
        allFilled = false
        break
      }
    }

    if (allFilled) {
      // 只有一个合法解时，提示位置完全确定，直接变灰
      if (valid.length === 1) {
        determined.add(h)
        continue
      }

      // 单行只有一个提示时，只要填满就直接变灰
      if (hints.length === 1) {
        determined.add(h)
        continue
      }

      // 整行已完全解出，直接变灰
      const isFullySolved = state.every(s => s !== null)
      if (isFullySolved) {
        determined.add(h)
        continue
      }

      // 多提示时，提示块被隔离（左右是 X 标记或边界）才变灰
      const leftIsolated = (first[0] === 0) || (state[first[0] - 1] === 0)
      const rightIsolated = (first[1] === size - 1) || (state[first[1] + 1] === 0)

      if (leftIsolated && rightIsolated) {
        determined.add(h)
      }
    }
  }

  return determined
}

import { formatStars } from './utils.js'

/**
 * 生成一个逻辑可解且解唯一的谜题
 * @param {number} size - 网格大小
 * @param {number} [maxAttempts=50] - 最大尝试次数
 * @returns {object} 生成的谜题对象
 */
export function generatePuzzle(size, maxAttempts = 50) {
  let solution = randomGrid(size)
  let rowHints = solution.map(row => getHints(row))
  let colHints = solution[0].map((_, colIndex) =>
    getHints(solution.map(row => row[colIndex]))
  )

  let attempts = 0

  while (attempts < maxAttempts) {
    // 检查逻辑可解性
    const { solved, sweeps } = fullSettle(rowHints, colHints)

    if (solved) {
      // 验证唯一性
      const solCount = countSolutions(rowHints, colHints)
      if (solCount === 1) {
        const stars = sweepsToStars(sweeps, size)
        return { solution, rowHints, colHints, sweeps, stars, starsText: formatStars(stars) }
      }
    }

    // 自适应：翻转随机格子以提高可解性
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

  // 回退：返回最后一次尝试的结果
  const { sweeps } = fullSettle(rowHints, colHints)
  const stars = sweepsToStars(sweeps, size)
  return { solution, rowHints, colHints, sweeps, stars, starsText: formatStars(stars) }
}

/**
 * 将谜题网格编码为紧凑字符串
 * @param {Grid} solution - 谜题解网格
 * @returns {string} 编码后的字符串，格式为 "size:base64"
 */
export function encodePuzzle(solution) {
  const size = solution.length
  const bits = []
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      bits.push(solution[r][c])
    }
  }

  // 填充至 6 的倍数
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

/**
 * 从编码字符串解码谜题
 * @param {string} code - 编码字符串
 * @returns {{size: number, solution: Grid}|null} 解码结果，失败返回 null
 */
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

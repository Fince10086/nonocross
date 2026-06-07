/**
 * 辅助功能模块
 * 提供冲突检测、可推导提示和自动标记功能
 */
import { getLinePossibilities, determineLine } from '../solver.js'
import { toSolverState } from '../constants.js'

/**
 * 检测某行/列是否存在冲突
 * 即当前状态与 hints 完全不兼容
 * @param {number|null[]} state - 行/列状态
 * @param {number[]} hints - 提示数字
 * @returns {boolean} 是否有冲突
 */
export function hasConflict(state, hints) {
  const possibilities = getLinePossibilities(hints, state.length)
  const valid = possibilities.filter((p) => {
    for (let i = 0; i < state.length; i++) {
      if (state[i] === null) continue
      if (state[i] !== p[i]) return false
    }
    return true
  })
  return valid.length === 0
}

/**
 * 检测某行/列是否还能推导出新的确定值
 * @param {number|null[]} state - 行/列状态
 * @param {number[]} hints - 提示数字
 * @returns {boolean} 是否有可推导的新标记
 */
export function hasDerivable(state, hints) {
  const derived = determineLine(state, hints)
  for (let i = 0; i < state.length; i++) {
    if (state[i] === null && derived[i] !== null) {
      return true
    }
  }
  return false
}

/**
 * 扫描网格，标记所有已完成行/列的剩余空格为 X
 * @param {number[][]} grid - 游戏网格
 * @param {number[][]} rowHints - 行提示
 * @param {number[][]} colHints - 列提示
 * @param {function} getDeterminedHints - getDeterminedHints 函数
 * @returns {{changes: {r: number, c: number}[], grid: number[][]}} 变更列表和新网格
 */
export function autoMarkCompleted(grid, rowHints, colHints, getDeterminedHints) {
  const size = grid.length
  const newGrid = grid.map((row) => [...row])
  const changes = []
  let changed = true
  let iterations = 0
  const MAX_ITERATIONS = size * 2

  function getRowState(r) {
    return newGrid[r].map(toSolverState)
  }

  function getColState(c) {
    return newGrid.map((row) => toSolverState(row[c]))
  }

  while (changed && iterations < MAX_ITERATIONS) {
    changed = false
    iterations++

    // 扫描行
    for (let r = 0; r < size; r++) {
      const hints = rowHints[r]
      const state = getRowState(r)
      const determined = getDeterminedHints(state, hints)
      if (determined.size === hints.length) {
        for (let c = 0; c < size; c++) {
          if (newGrid[r][c] === 0) {
            newGrid[r][c] = 2
            changes.push({ r, c })
            changed = true
          }
        }
      }
    }

    // 扫描列
    for (let c = 0; c < size; c++) {
      const hints = colHints[c]
      const state = getColState(c)
      const determined = getDeterminedHints(state, hints)
      if (determined.size === hints.length) {
        for (let r = 0; r < size; r++) {
          if (newGrid[r][c] === 0) {
            newGrid[r][c] = 2
            changes.push({ r, c })
            changed = true
          }
        }
      }
    }
  }

  return { changes, grid: newGrid }
}

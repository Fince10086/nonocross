/**
 * 提示状态判断模块
 * 独立于求解器核心，用于 UI 中灰显已完成的提示数字
 */
import { getLinePossibilities } from './solver.js'

/**
 * @typedef {number|null[]} KnownLine - 已知状态行，null 表示未知
 * @typedef {number[]} Hints - 提示数字数组，如 [2, 1, 3]
 */

/**
 * 获取已确定的提示索引
 * @param {KnownLine} state - 当前行状态（null=空, 1=已填, 0=X标记）
 * @param {Hints} hints - 提示数字
 * @returns {Set<number>} 已确定提示的索引集合
 */
export function getDeterminedHints(state, hints) {
  const size = state.length

  // 全空行特殊情况
  if (hints.length === 1 && hints[0] === 0) {
    return new Set()
  }

  // 获取所有可能的合法排列
  const allPossibilities = getLinePossibilities(hints, size)

  // 过滤与当前状态兼容的排列
  const valid = allPossibilities.filter((p) => {
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
    const allSame = posList.every((p) => p[0] === first[0] && p[1] === first[1])
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
      const isFullySolved = state.every((s) => s !== null)
      if (isFullySolved) {
        determined.add(h)
        continue
      }

      // 多提示时，提示块被隔离（左右是 X 标记或边界）才变灰
      const leftIsolated = first[0] === 0 || state[first[0] - 1] === 0
      const rightIsolated = first[1] === size - 1 || state[first[1] + 1] === 0

      if (leftIsolated && rightIsolated) {
        determined.add(h)
      }
    }
  }

  return determined
}

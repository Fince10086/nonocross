// Fixed 10x10 nonogram puzzle
// 1 = filled, 0 = empty

export const solution = [
  [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
  [1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 0, 0, 1, 1, 0, 0, 0, 0]
]

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
  if (count > 0) {
    hints.push(count)
  }
  if (hints.length === 0) {
    hints.push(0)
  }
  return hints
}

export const rowHints = solution.map(row => getHints(row))
export const colHints = solution[0].map((_, colIndex) => getHints(solution.map(row => row[colIndex])))

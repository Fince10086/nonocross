/**
 * Nonogram puzzle generator with uniqueness guarantee
 * Runs inside a Web Worker
 */
import { generatePuzzle } from '../src/solver.js'

self.onmessage = function (e) {
  if (e.data.type === 'generate') {
    const size = e.data.size || 10
    const puzzle = generatePuzzle(size, 50)
    self.postMessage({ type: 'result', puzzle })
  }
}

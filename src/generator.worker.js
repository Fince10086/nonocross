/**
 * Nonogram puzzle generator with uniqueness guarantee
 * Runs inside a Web Worker
 */
import { generatePuzzle } from './solver.js'

self.onmessage = function (e) {
  if (e.data.type === 'generate') {
    try {
      const size = e.data.size || 10
      const id = e.data.id
      const puzzle = generatePuzzle(size, 50)
      self.postMessage({ type: 'result', puzzle, id })
    } catch (err) {
      self.postMessage({
        type: 'error',
        error: err.message || 'Unknown worker error',
        id: e.data.id,
      })
    }
  }
}

let worker = null

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('./generator.worker.js', import.meta.url), { type: 'module' })
  }
  return worker
}

export function generatePuzzleAsync(size = 10) {
  return new Promise((resolve) => {
    const w = getWorker()
    w.onmessage = (e) => {
      if (e.data.type === 'result') {
        resolve(e.data.puzzle)
      }
    }
    w.postMessage({ type: 'generate', size })
  })
}

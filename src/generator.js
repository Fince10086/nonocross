let worker = null
let requestId = 0

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('./generator.worker.js', import.meta.url), { type: 'module' })
    worker.onerror = (e) => {
      console.error('Worker error:', e)
    }
  }
  return worker
}

export function generatePuzzleAsync(size = 10) {
  const id = ++requestId
  return new Promise((resolve, reject) => {
    const w = getWorker()

    const handler = (e) => {
      if (e.data.id !== id) return
      w.removeEventListener('message', handler)
      if (e.data.type === 'result') {
        resolve(e.data.puzzle)
      } else if (e.data.type === 'error') {
        reject(new Error(e.data.error || 'Worker failed'))
      }
    }

    w.addEventListener('message', handler)
    w.postMessage({ type: 'generate', size, id })
  })
}

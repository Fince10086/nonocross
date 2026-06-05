import { fullSettle } from '../src/solver.js'
import fs from 'fs'

const puzzles = JSON.parse(fs.readFileSync('./public/puzzles.json', 'utf8'))

const stats = {
  5: [],
  10: [],
  15: []
}

for (const p of puzzles) {
  const { sweeps } = fullSettle(p.rowHints, p.colHints)
  stats[p.size].push({ id: p.id, sweeps })
}

function printStats(size, data) {
  console.log(`\n=== ${size}x${size} (${data.length} puzzles) ===`)
  const sorted = data.sort((a, b) => a.sweeps - b.sweeps)
  const min = sorted[0].sweeps
  const max = sorted[sorted.length - 1].sweeps
  const avg = (sorted.reduce((s, p) => s + p.sweeps, 0) / sorted.length).toFixed(1)
  const median = sorted[Math.floor(sorted.length / 2)].sweeps

  console.log(`Range: ${min} - ${max} sweeps`)
  console.log(`Average: ${avg}`)
  console.log(`Median: ${median}`)

  // Distribution histogram
  const histogram = {}
  for (const p of sorted) {
    histogram[p.sweeps] = (histogram[p.sweeps] || 0) + 1
  }
  console.log('Distribution:')
  for (let i = min; i <= max; i++) {
    const count = histogram[i] || 0
    if (count > 0) {
      const bar = '█'.repeat(count)
      console.log(`  ${String(i).padStart(2)}: ${bar} (${count})`)
    }
  }

  // Percentiles
  const percentiles = [10, 25, 50, 75, 90]
  console.log('Percentiles:')
  for (const pct of percentiles) {
    const idx = Math.floor(sorted.length * pct / 100)
    console.log(`  ${pct}%: ${sorted[idx].sweeps} sweeps`)
  }
}

printStats(5, stats[5])
printStats(10, stats[10])
printStats(15, stats[15])

// Overall
const all = [...stats[5], ...stats[10], ...stats[15]]
console.log(`\n=== OVERALL (${all.length} puzzles) ===`)
const sorted = all.sort((a, b) => a.sweeps - b.sweeps)
console.log(`Range: ${sorted[0].sweeps} - ${sorted[sorted.length - 1].sweeps}`)
console.log(`Average: ${(sorted.reduce((s, p) => s + p.sweeps, 0) / sorted.length).toFixed(1)}`)

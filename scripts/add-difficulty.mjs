import { fullSettle } from '../src/solver.js'
import fs from 'fs'

const puzzles = JSON.parse(fs.readFileSync('./public/puzzles.json', 'utf8'))

// Thresholds based on percentiles (10%, 25%, 50%, 75%, 90%)
const thresholds = {
  5:  [4, 5, 6, 7, 8, 10],   // 1, 1.5, 2.5, 3.5, 4.5, 5
  10: [8, 9, 11, 14, 18, 29],
  15: [11, 15, 18, 21, 28, 37]
}

function sweepsToStars(sweeps, size) {
  const t = thresholds[size]
  if (sweeps <= t[0]) return 1
  if (sweeps <= t[1]) return 1.5
  if (sweeps <= t[2]) return 2.5
  if (sweeps <= t[3]) return 3.5
  if (sweeps <= t[4]) return 4.5
  return 5
}

function formatStars(rating) {
  const full = Math.floor(rating)
  const half = rating % 1 === 0.5
  const empty = 5 - full - (half ? 1 : 0)
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty)
}

const enriched = puzzles.map(p => {
  const { sweeps } = fullSettle(p.rowHints, p.colHints)
  const stars = sweepsToStars(sweeps, p.size)
  const starsText = formatStars(stars)
  return {
    ...p,
    sweeps,
    stars,
    starsText
  }
})

fs.writeFileSync('./public/puzzles.json', JSON.stringify(enriched, null, 2))

// Print distribution
console.log('Difficulty distribution:')
for (const size of [5, 10, 15]) {
  const sizePuzzles = enriched.filter(p => p.size === size)
  const counts = {}
  for (const p of sizePuzzles) {
    counts[p.stars] = (counts[p.stars] || 0) + 1
  }
  console.log(`\n${size}x${size}:`)
  for (let s = 1; s <= 5; s += 0.5) {
    const count = counts[s] || 0
    if (count > 0) {
      console.log(`  ${formatStars(s)}: ${count} puzzles`)
    }
  }
}

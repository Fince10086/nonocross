import { generatePuzzle, formatStars } from '../src/solver.js'
import fs from 'fs'
import path from 'path'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

const TARGET_PER_STAR = 20
const STAR_LEVELS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]

async function generateBatchByStars(size) {
  const buckets = {}
  STAR_LEVELS.forEach(s => buckets[s] = [])
  
  let attempts = 0
  const maxAttempts = TARGET_PER_STAR * STAR_LEVELS.length * 100
  
  console.log(`\nGenerating ${size}x${size} puzzles...`)
  
  while (attempts < maxAttempts) {
    const puzzle = generatePuzzle(size, 200)
    
    if (STAR_LEVELS.includes(puzzle.stars) && buckets[puzzle.stars].length < TARGET_PER_STAR) {
      buckets[puzzle.stars].push(puzzle)
      const filled = STAR_LEVELS.reduce((sum, s) => sum + buckets[s].length, 0)
      process.stdout.write(`\r  Progress: ${filled}/${TARGET_PER_STAR * STAR_LEVELS.length} (attempt ${attempts})`)
    }
    
    if (STAR_LEVELS.every(s => buckets[s].length >= TARGET_PER_STAR)) {
      break
    }
    
    attempts++
  }
  
  process.stdout.write('\n')
  
  // 报告每个星级的数量
  console.log('  Distribution:')
  for (const star of STAR_LEVELS) {
    const count = buckets[star].length
    const target = TARGET_PER_STAR
    console.log(`    ${formatStars(star)}: ${count}/${target} ${count >= target ? '✓' : '✗'}`)
  }
  
  // 合并并重新编号
  const all = []
  let idx = 1
  for (const star of STAR_LEVELS) {
    for (const p of buckets[star]) {
      p.id = `${size}x${size}-${String(idx).padStart(3, '0')}`
      all.push(p)
      idx++
    }
  }
  
  return all
}

async function main() {
  console.log('Starting puzzle generation with star-based distribution...')
  console.log(`Target: ${TARGET_PER_STAR} puzzles per star level`)
  console.log(`Star levels: ${STAR_LEVELS.join(', ')}`)

  const puzzles5 = await generateBatchByStars(5)
  const puzzles10 = await generateBatchByStars(10)
  const puzzles15 = await generateBatchByStars(15)

  const allPuzzles = [...puzzles5, ...puzzles10, ...puzzles15]

  const outputPath = path.join(__dirname, '../public/puzzles.json')
  fs.writeFileSync(outputPath, JSON.stringify(allPuzzles, null, 2))

  console.log(`\nDone! Generated ${allPuzzles.length} puzzles.`)
  console.log(`Saved to ${outputPath}`)
}

main()

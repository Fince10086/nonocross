import { generatePuzzle } from '../src/solver.js'
import fs from 'fs'
import path from 'path'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

async function generateBatch(size, count) {
  const puzzles = []
  for (let i = 0; i < count; i++) {
    const puzzle = generatePuzzle(size, 100)
    puzzles.push({
      id: `${size}x${size}-${String(i + 1).padStart(3, '0')}`,
      size,
      solution: puzzle.solution,
      rowHints: puzzle.rowHints,
      colHints: puzzle.colHints
    })
    console.log(`Generated ${size}x${size} puzzle ${i + 1}/${count}`)
  }
  return puzzles
}

async function main() {
  console.log('Starting puzzle generation...')

  const puzzles5 = await generateBatch(5, 50)
  const puzzles10 = await generateBatch(10, 100)
  const puzzles15 = await generateBatch(15, 50)

  const allPuzzles = [...puzzles5, ...puzzles10, ...puzzles15]

  const outputPath = path.join(__dirname, '../public/puzzles.json')
  fs.writeFileSync(outputPath, JSON.stringify(allPuzzles, null, 2))

  console.log(`\nDone! Generated ${allPuzzles.length} puzzles.`)
  console.log(`Saved to ${outputPath}`)
}

main()

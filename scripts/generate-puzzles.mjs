/**
 * 批量生成 Nonogram 谜题
 * 每个大小每个难度生成 targetCount 道
 */
import {
  generatePuzzle,
  sweepsToStars,
  encodePuzzle,
} from '../src/solver.js'

import fs from 'fs'

const TARGET_PER_BUCKET = 100
const SIZES = [5, 10, 15]

const starThresholds = {
  5:  [3, 4, 5, 6, 7, 8, 9, 10],
  10: [7, 9, 11, 13, 15, 17, 20, 24],
  15: [11, 14, 17, 19, 22, 25, 28, 32]
}

function getStars(sweeps, size) {
  const t = starThresholds[size]
  if (sweeps <= t[0]) return 1
  if (sweeps <= t[1]) return 1.5
  if (sweeps <= t[2]) return 2
  if (sweeps <= t[3]) return 2.5
  if (sweeps <= t[4]) return 3
  if (sweeps <= t[5]) return 3.5
  if (sweeps <= t[6]) return 4
  if (sweeps <= t[7]) return 4.5
  return 5
}

async function generateForSize(size) {
  const buckets = {
    1: [], 1.5: [], 2: [], 2.5: [],
    3: [], 3.5: [], 4: [], 4.5: [], 5: [],
  }
  
  let attempts = 0
  let generated = 0
  
  console.log(`\nGenerating ${size}x${size} puzzles...`)
  
  // 先检查已有的谜题
  const existingFile = `public/puzzles-${size}.json`
  if (fs.existsSync(existingFile)) {
    const lines = fs.readFileSync(existingFile, 'utf-8')
      .trim().split('\n').filter(l => l.trim())
    for (const line of lines) {
      const parts = line.split(':')
      if (parts.length !== 4) continue
      const sweeps = parseInt(parts[3], 10)
      const stars = getStars(sweeps, size)
      if (buckets[stars].length < TARGET_PER_BUCKET) {
        buckets[stars].push(line)
      }
    }
    console.log(`  Loaded ${lines.length} existing puzzles`)
  }
  
  // 计算还缺多少
  const needed = {}
  let totalNeeded = 0
  for (const star of Object.keys(buckets)) {
    const need = TARGET_PER_BUCKET - buckets[star].length
    needed[star] = need
    totalNeeded += need
  }
  
  if (totalNeeded === 0) {
    console.log(`  Already have enough puzzles!`)
    return buckets
  }
  
  console.log(`  Need to generate ${totalNeeded} more puzzles`)
  
  while (totalNeeded > 0) {
    const puzzle = generatePuzzle(size, 200)
    const stars = getStars(puzzle.sweeps, size)
    
    if (buckets[stars].length < TARGET_PER_BUCKET) {
      const id = String(buckets[stars].length + 1).padStart(3, '0')
      const code = encodePuzzle(puzzle.solution, puzzle.sweeps)
      // code 格式: size:base64:sweeps
      const line = `${id}:${code}`
      buckets[stars].push(line)
      generated++
      totalNeeded--
      
      if (generated % 10 === 0) {
        const counts = Object.entries(buckets)
          .map(([s, arr]) => `${s}★:${arr.length}`)
          .join(', ')
        console.log(`  Generated ${generated}, buckets: ${counts}`)
      }
    }
    
    attempts++
    if (attempts % 100 === 0) {
      console.log(`  Attempts: ${attempts}, generated: ${generated}`)
    }
  }
  
  console.log(`  Done! Total attempts: ${attempts}, generated: ${generated}`)
  return buckets
}

async function main() {
  // 只生成 15x15（5x5 和 10x10 已完成）
  const sizesToGenerate = [15]
  
  for (const size of sizesToGenerate) {
    const buckets = await generateForSize(size)
    
    // 合并所有难度的谜题
    const allPuzzles = []
    for (const star of [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]) {
      allPuzzles.push(...buckets[star])
    }
    
    // 重新编号
    const renumbered = allPuzzles.map((line, idx) => {
      const parts = line.split(':')
      // parts: [id, size, base64, sweeps]
      const newId = String(idx + 1).padStart(3, '0')
      return `${newId}:${parts[1]}:${parts[2]}:${parts[3]}`
    })
    
    const output = renumbered.join('\n') + '\n'
    fs.writeFileSync(`public/puzzles-${size}.json`, output)
    console.log(`  Wrote ${renumbered.length} puzzles to puzzles-${size}.json`)
  }
  
  console.log('\nAll done!')
}

main().catch(console.error)

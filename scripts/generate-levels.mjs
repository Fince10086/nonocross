/**
 * 生成关卡配置文件
 * 
 * 前500关：平滑过渡
 * - 尺寸：5×5(多→少) → 10×10(少→多→少) → 15×15(少→多)
 * - 星级：1-2.5★(多→少) → 2.5-4★(少→多→少) → 4-5★(少→多)
 * 
 * 501+关：确定性循环
 * - 尺寸：5→10→15循环
 * - 星级：基于seed的伪随机，难度缓慢递增
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

// 难度阈值
const STAR_THRESHOLDS = {
  5:  [3, 4, 5, 6, 7, 8, 9, 10],
  10: [7, 9, 11, 13, 15, 17, 20, 24],
  15: [11, 14, 17, 19, 22, 25, 28, 32],
}

const STAR_RATINGS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]

function getStars(sweeps, size) {
  const thresholds = STAR_THRESHOLDS[size]
  for (let i = 0; i < thresholds.length; i++) {
    if (sweeps <= thresholds[i]) {
      return STAR_RATINGS[i]
    }
  }
  return 5
}

function parsePuzzleFile(filename) {
  const content = readFileSync(join(rootDir, 'public', filename), 'utf-8')
  const lines = content.trim().split('\n').filter(Boolean)
  
  return lines.map((line, index) => {
    const [id, size, solution, sweeps] = line.trim().split(':')
    const sizeNum = parseInt(size)
    const sweepsNum = parseInt(sweeps)
    return {
      id,
      size: sizeNum,
      sweeps: sweepsNum,
      stars: getStars(sweepsNum, sizeNum),
      lineIndex: index,
    }
  })
}

// 加载所有谜题
console.log('Loading puzzle files...')
const puzzles5 = parsePuzzleFile('puzzles-5.json')
const puzzles10 = parsePuzzleFile('puzzles-10.json')
const puzzles15 = parsePuzzleFile('puzzles-15.json')

console.log(`Loaded: ${puzzles5.length} 5×5, ${puzzles10.length} 10×10, ${puzzles15.length} 15×15`)

// 按尺寸和星级分类
function categorize(puzzles) {
  const byStars = {}
  STAR_RATINGS.forEach(s => byStars[s] = [])
  puzzles.forEach(p => {
    if (byStars[p.stars]) {
      byStars[p.stars].push(p)
    }
  })
  return byStars
}

const bySize = {
  5: categorize(puzzles5),
  10: categorize(puzzles10),
  15: categorize(puzzles15),
}

// 检查各星级分布
for (const size of [5, 10, 15]) {
  console.log(`\n${size}×${size} star distribution:`)
  STAR_RATINGS.forEach(s => {
    const count = bySize[size][s].length
    if (count > 0) console.log(`  ${s}★: ${count}`)
  })
}

// 伪随机数生成器（确定性）
function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// 获取星级范围
function getStarRange(stars) {
  if (stars <= 2.5) return 'easy'
  if (stars <= 4) return 'medium'
  return 'hard'
}

// 按关卡计算尺寸概率
function getSizeProbability(level) {
  const progress = level / 500
  
  // 5×5: 从0.8降到0.05
  const p5 = Math.max(0.05, 0.8 - progress * 0.75)
  
  // 15×15: 从0升到0.5
  const p15 = Math.min(0.5, progress * 0.5)
  
  // 10×10: 剩余部分
  const p10 = 1 - p5 - p15
  
  return { 5: p5, 10: p10, 15: p15 }
}

// 按关卡计算星级范围概率
function getStarRangeProbability(level) {
  const progress = level / 500
  
  // Easy (1-2.5★): 从0.75降到0.1
  const pEasy = Math.max(0.1, 0.75 - progress * 0.65)
  
  // Hard (4-5★): 从0.05升到0.45
  const pHard = Math.min(0.45, 0.05 + progress * 0.4)
  
  // Medium (2.5-4★): 剩余部分
  const pMedium = 1 - pEasy - pHard
  
  return { easy: pEasy, medium: pMedium, hard: pHard }
}

// 在指定尺寸和星级范围内随机选择一道题
function pickPuzzle(size, starRange, rng, usedPuzzles) {
  const puzzles = bySize[size]
  let candidates = []
  
  if (starRange === 'easy') {
    candidates = [...puzzles[1], ...puzzles[1.5], ...puzzles[2], ...puzzles[2.5]]
  } else if (starRange === 'medium') {
    candidates = [...puzzles[2.5], ...puzzles[3], ...puzzles[3.5], ...puzzles[4]]
  } else if (starRange === 'hard') {
    candidates = [...puzzles[4], ...puzzles[4.5], ...puzzles[5]]
  }
  
  // 过滤已使用的
  candidates = candidates.filter(p => !usedPuzzles.has(`${p.size}-${p.id}`))
  
  if (candidates.length === 0) {
    // 如果没有候选，从所有未使用的该尺寸题目中选
    candidates = Object.values(puzzles).flat().filter(p => !usedPuzzles.has(`${p.size}-${p.id}`))
  }
  
  if (candidates.length === 0) {
    return null
  }
  
  const idx = Math.floor(rng() * candidates.length)
  return candidates[idx]
}

// 生成前500关
function generateLevels1to500() {
  const levels = []
  const usedPuzzles = new Set()
  const rng = mulberry32(42) // 固定seed保证可重复
  
  for (let level = 1; level <= 500; level++) {
    const sizeProb = getSizeProbability(level)
    const starProb = getStarRangeProbability(level)
    
    // 根据概率选择尺寸
    const sizeRoll = rng()
    let size
    if (sizeRoll < sizeProb[5]) {
      size = 5
    } else if (sizeRoll < sizeProb[5] + sizeProb[10]) {
      size = 10
    } else {
      size = 15
    }
    
    // 根据概率选择星级范围
    const starRoll = rng()
    let starRange
    if (starRoll < starProb.easy) {
      starRange = 'easy'
    } else if (starRoll < starProb.easy + starProb.medium) {
      starRange = 'medium'
    } else {
      starRange = 'hard'
    }
    
    // 选题
    const puzzle = pickPuzzle(size, starRange, rng, usedPuzzles)
    
    if (!puzzle) {
      console.error(`Failed to find puzzle for level ${level}`)
      break
    }
    
    usedPuzzles.add(`${puzzle.size}-${puzzle.id}`)
    levels.push({
      level,
      size: puzzle.size,
      stars: puzzle.stars,
      puzzleId: `${puzzle.size}-${puzzle.id}`,
    })
  }
  
  return levels
}

// 生成501+关（确定性序列）
function generateLevels501Plus(startLevel, count) {
  const levels = []
  const usedPuzzles = new Set()
  
  for (let i = 0; i < count; i++) {
    const level = startLevel + i
    const rng = mulberry32(level * 997) // 每关独立seed
    
    // 尺寸循环：5→10→15
    const sizeCycle = [5, 10, 15]
    const size = sizeCycle[(level - 1) % 3]
    
    // 难度缓慢递增：基础1★ + (level-500)/250，封顶4.5★
    const baseDifficulty = Math.min(4.5, 1 + (level - 500) / 250)
    
    // 在基础难度±0.5范围内随机
    const minStars = Math.max(1, baseDifficulty - 0.5)
    const maxStars = Math.min(5, baseDifficulty + 0.5)
    
    // 找到可用的星级
    const availableStars = STAR_RATINGS.filter(s => s >= minStars && s <= maxStars)
    const targetStar = availableStars[Math.floor(rng() * availableStars.length)]
    
    // 从对应尺寸和星级选未使用过的题
    const puzzles = bySize[size][targetStar]
    let candidates = puzzles.filter(p => !usedPuzzles.has(`${p.size}-${p.id}`))
    
    if (candidates.length === 0) {
      // 如果没找到，从相邻星级找
      for (const s of STAR_RATINGS) {
        candidates = bySize[size][s].filter(p => !usedPuzzles.has(`${p.size}-${p.id}`))
        if (candidates.length > 0) break
      }
    }
    
    if (candidates.length === 0) {
      console.error(`Failed to find puzzle for level ${level}`)
      break
    }
    
    const puzzle = candidates[Math.floor(rng() * candidates.length)]
    usedPuzzles.add(`${puzzle.size}-${puzzle.id}`)
    
    levels.push({
      level,
      size: puzzle.size,
      stars: puzzle.stars,
      puzzleId: `${puzzle.size}-${puzzle.id}`,
    })
  }
  
  return levels
}

// 生成所有关卡
console.log('\nGenerating levels 1-500...')
const levels1to500 = generateLevels1to500()
console.log(`Generated ${levels1to500.length} levels`)

// 统计前500关的分布
console.log('\nDistribution analysis for levels 1-500:')
const sizeDist = { 5: 0, 10: 0, 15: 0 }
const starDist = { easy: 0, medium: 0, hard: 0 }
levels1to500.forEach(l => {
  sizeDist[l.size]++
  starDist[getStarRange(l.stars)]++
})
console.log('Size distribution:', sizeDist)
console.log('Star distribution:', starDist)

// 检查各阶段分布
for (const [start, end] of [[1, 167], [168, 334], [335, 500]]) {
  const subset = levels1to500.filter(l => l.level >= start && l.level <= end)
  const sDist = { 5: 0, 10: 0, 15: 0 }
  const stDist = { easy: 0, medium: 0, hard: 0 }
  subset.forEach(l => {
    sDist[l.size]++
    stDist[getStarRange(l.stars)]++
  })
  console.log(`\nLevels ${start}-${end}:`)
  console.log('  Size:', sDist)
  console.log('  Stars:', stDist)
}

// 计算剩余可用的题目数量
const usedIn500 = new Set(levels1to500.map(l => l.puzzleId))
const remaining5 = puzzles5.filter(p => !usedIn500.has(`5-${p.id}`)).length
const remaining10 = puzzles10.filter(p => !usedIn500.has(`10-${p.id}`)).length
const remaining15 = puzzles15.filter(p => !usedIn500.has(`15-${p.id}`)).length
console.log(`\nRemaining puzzles after 500: 5×5=${remaining5}, 10×10=${remaining10}, 15×15=${remaining15}`)

// 生成501-2700关
const remainingCount = Math.min(2200, remaining5 + remaining10 + remaining15)
console.log(`\nGenerating levels 501-${500 + remainingCount}...`)
const levels501Plus = generateLevels501Plus(501, remainingCount)
console.log(`Generated ${levels501Plus.length} levels`)

// 合并所有关卡
const allLevels = [...levels1to500, ...levels501Plus]

// 输出关卡统计
console.log(`\nTotal levels: ${allLevels.length}`)
const finalSizeDist = { 5: 0, 10: 0, 15: 0 }
allLevels.forEach(l => finalSizeDist[l.size]++)
console.log('Final size distribution:', finalSizeDist)

// 保存关卡文件
const output = {
  totalLevels: allLevels.length,
  levels: allLevels,
}

writeFileSync(
  join(rootDir, 'public', 'levels.json'),
  JSON.stringify(output, null, 2)
)

console.log('\n✓ Generated public/levels.json successfully!')
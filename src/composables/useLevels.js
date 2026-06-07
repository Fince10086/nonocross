/**
 * 关卡系统状态管理
 */
import { ref, computed } from 'vue'

const STORAGE_KEY = 'nonocross-levels'
const MAX_LEVEL = 2700

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to load level progress:', e)
    return null
  }
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save level progress:', e)
  }
}

export function useLevels() {
  const levelsData = ref(null)
  const isLoading = ref(false)
  
  // 进度状态
  const records = ref([]) // 每关记录 [ { level, time, assisted } ]
  
  // 计算已完成的最高关卡（用于解锁范围）
  const completedLevel = computed(() => {
    if (records.value.length === 0) return 0
    return Math.max(...records.value.map(r => r.level))
  })
  
  // 计算已完成的关卡数量
  const completedCount = computed(() => {
    return records.value.length
  })
  
  // 加载关卡数据
  async function loadLevelData() {
    if (levelsData.value) return
    isLoading.value = true
    try {
      const res = await fetch('/levels.json')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      levelsData.value = await res.json()
    } catch (e) {
      console.error('Failed to load level data:', e)
    } finally {
      isLoading.value = false
    }
  }
  
  // 加载进度
  function loadProgress() {
    const saved = loadFromStorage()
    if (saved) {
      records.value = saved.records || []
    }
  }
  
  // 保存进度
  function saveProgress() {
    saveToStorage({
      records: records.value,
    })
  }
  
  // 获取指定关卡信息
  function getLevelInfo(level) {
    if (!levelsData.value) return null
    return levelsData.value.levels.find(l => l.level === level) || null
  }
  
  // 计算解锁范围
  const unlockedMax = computed(() => {
    return Math.min(MAX_LEVEL, completedLevel.value + 10)
  })
  
  // 检查关卡是否已解锁
  function isLevelUnlocked(level) {
    return level >= 1 && level <= unlockedMax.value
  }
  
  // 检查关卡是否已完成（基于 records 数组，而不是 completedLevel）
  function isLevelCompleted(level) {
    return records.value.some(r => r.level === level)
  }
  
  // 获取关卡记录
  function getLevelRecord(level) {
    return records.value.find(r => r.level === level) || null
  }
  
  // 记录关卡完成
  function recordCompletion(level, time, assisted) {
    const existingIndex = records.value.findIndex(r => r.level === level)
    const record = { level, time, assisted }
    
    if (existingIndex >= 0) {
      // 已完成的关卡：如果新成绩更好（时间更短或无辅助），则更新
      const existing = records.value[existingIndex]
      const isBetter = time < existing.time
      const isCleaner = !assisted && existing.assisted
      if (isBetter || isCleaner) {
        records.value[existingIndex] = record
      }
    } else {
      records.value.push(record)
    }
    
    saveProgress()
  }
  
  // 跳转到指定关卡
  async function jumpToLevel(level) {
    await loadLevelData()
    if (!isLevelUnlocked(level)) return null
    
    const info = getLevelInfo(level)
    if (!info) return null
    
    return info
  }
  
  // 获取下一关
  function getNextLevel(currentLevel) {
    const next = currentLevel + 1
    if (next > MAX_LEVEL) return null
    return getLevelInfo(next)
  }
  
  // 获取上一关
  function getPrevLevel(currentLevel) {
    const prev = currentLevel - 1
    if (prev < 1) return null
    return getLevelInfo(prev)
  }
  
  return {
    levelsData,
    isLoading,
    completedLevel,
    completedCount,
    records,
    unlockedMax,
    loadLevelData,
    loadProgress,
    saveProgress,
    getLevelInfo,
    isLevelUnlocked,
    isLevelCompleted,
    getLevelRecord,
    recordCompletion,
    jumpToLevel,
    getNextLevel,
    getPrevLevel,
  }
}
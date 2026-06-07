import { ref } from 'vue'
import { encodePuzzle, decodePuzzle, getHintsFromSolution } from '../solver.js'
import { storageGet, storageSet } from '../storage.js'

const FAVORITES_KEY = 'nonocross-favorites'
const MAX_FAVORITES = 100

function isValidFavorite(fav) {
  if (!fav || typeof fav !== 'object') return false
  if (typeof fav.code !== 'string' || !fav.code.includes(':')) return false
  if (typeof fav.size !== 'number' || fav.size < 1) return false
  if (fav.grid !== null && fav.grid !== undefined) {
    if (!Array.isArray(fav.grid) || !fav.grid.every(row => Array.isArray(row))) return false
  }
  if (typeof fav.seconds !== 'number') return false
  if (typeof fav.savedAt !== 'string') return false
  return true
}

export function useFavorites() {
  const favorites = ref([])

  function loadFavorites() {
    const parsed = storageGet(FAVORITES_KEY, [])
    if (!Array.isArray(parsed)) {
      favorites.value = []
      return
    }
    const valid = parsed.filter(isValidFavorite)
    if (valid.length !== parsed.length) {
      console.warn(`Filtered out ${parsed.length - valid.length} invalid favorites`)
    }
    favorites.value = valid.slice(0, MAX_FAVORITES)
  }

  function saveFavorites() {
    storageSet(FAVORITES_KEY, favorites.value.slice(0, MAX_FAVORITES))
  }

  /**
   * 比较两个谜题编码是否指向同一个解
   */
  function isSamePuzzle(codeA, codeB) {
    const a = codeA.split(':')
    const b = codeB.split(':')
    return a[0] === b[0] && a[1] === b[1]
  }

  function isInFavorites(solution) {
    if (!solution) return false
    const code = encodePuzzle(solution)
    return favorites.value.some((f) => isSamePuzzle(f.code, code))
  }

  function saveCurrentPuzzle({ solution, size, starsText, isComplete, grid, seconds, sweeps }) {
    if (!solution) return
    const code = encodePuzzle(solution, sweeps || 0)
    const existingIndex = favorites.value.findIndex((f) => isSamePuzzle(f.code, code))

    const favorite = {
      code,
      size,
      stars: starsText ? parseFloat(starsText.replace(/[^0-9.]/g, '')) || null : null,
      starsText,
      completed: isComplete,
      grid: isComplete ? null : grid.map((row) => [...row]),
      seconds,
      savedAt: new Date().toISOString(),
      completedAt: isComplete ? new Date().toISOString() : null,
    }

    if (existingIndex >= 0) {
      favorites.value[existingIndex] = favorite
    } else {
      favorites.value.push(favorite)
    }
    saveFavorites()
  }

  function deleteFromFavorites(solution) {
    if (!solution) return
    const code = encodePuzzle(solution)
    favorites.value = favorites.value.filter((f) => !isSamePuzzle(f.code, code))
    saveFavorites()
  }

  function markCompleted(solution, seconds) {
    if (!solution) return
    const code = encodePuzzle(solution)
    const idx = favorites.value.findIndex((f) => isSamePuzzle(f.code, code))
    if (idx >= 0) {
      favorites.value[idx].completed = true
      favorites.value[idx].completedAt = new Date().toISOString()
      favorites.value[idx].seconds = seconds
      favorites.value[idx].grid = null
      saveFavorites()
    }
  }

  function loadFavoriteData(fav) {
    const result = decodePuzzle(fav.code)
    if (!result) return null

    const { size, solution, sweeps } = result
    const { rowHints, colHints } = getHintsFromSolution(solution)

    return {
      size,
      solution,
      rowHints,
      colHints,
      starsText: fav.starsText,
      isComplete: fav.completed,
      grid: fav.completed ? null : fav.grid,
      seconds: fav.seconds,
      sweeps,
    }
  }

  return {
    favorites,
    loadFavorites,
    saveFavorites,
    isInFavorites,
    saveCurrentPuzzle,
    deleteFromFavorites,
    markCompleted,
    loadFavoriteData,
    formatSavedTime: formatSavedTimeImpl,
  }
}

export function formatSavedTime(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  return (
    d.toLocaleDateString() +
    ' ' +
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  )
}

const formatSavedTimeImpl = formatSavedTime

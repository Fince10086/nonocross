/**
 * localStorage 读写封装
 */

export function storageGet(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return defaultValue
    return JSON.parse(raw)
  } catch (e) {
    console.error(`Failed to load ${key}:`, e)
    return defaultValue
  }
}

export function storageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error(`Failed to save ${key}:`, e)
  }
}

export function storageRemove(key) {
  try {
    localStorage.removeItem(key)
  } catch (e) {
    console.error(`Failed to remove ${key}:`, e)
  }
}

/**
 * 公共工具函数
 */

/**
 * 格式化秒数为 MM:SS 字符串
 * @param {number} totalSeconds - 总秒数
 * @returns {string} 格式化后的时间字符串
 */
export function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const s = (totalSeconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

/**
 * 将星级评分格式化为 Unicode 星号字符串
 * @param {number} rating - 星级评分（1-5）
 * @returns {string} 格式化后的星号字符串
 * @example
 * formatStars(2.5) // "★★½☆☆"
 */
export function formatStars(rating) {
  const full = Math.floor(rating)
  const half = rating % 1 === 0.5
  const empty = 5 - full - (half ? 1 : 0)
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty)
}

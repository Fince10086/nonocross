import { ref, computed, onUnmounted, readonly } from 'vue'
import { formatTime } from '../utils.js'

/**
 * 计时器 Composable
 * 提供游戏计时功能，支持开始、暂停、恢复、停止和重置
 * @returns {object} 计时器状态和操作方法
 */
export function useTimer() {
  const seconds = ref(0)
  const isRunning = ref(false)
  const isPaused = ref(false)
  let timerInterval = null

  /**
   * 格式化后的时间显示
   */
  const formattedTime = computed(() => formatTime(seconds.value))

  /**
   * 开始计时
   */
  function start() {
    if (!isRunning.value && !isPaused.value) {
      isRunning.value = true
      timerInterval = setInterval(() => {
        seconds.value++
      }, 1000)
    }
  }

  /**
   * 停止计时
   */
  function stop() {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    isRunning.value = false
  }

  /**
   * 暂停计时
   */
  function pause() {
    if (!isRunning.value) return
    isPaused.value = true
    stop()
  }

  /**
   * 恢复计时
   */
  function resume() {
    if (!isPaused.value) return
    isPaused.value = false
    start()
  }

  /**
   * 切换暂停/恢复状态
   */
  function togglePause() {
    if (isPaused.value) {
      resume()
    } else {
      pause()
    }
  }

  /**
   * 重置计时器
   */
  function reset() {
    stop()
    seconds.value = 0
    isPaused.value = false
  }

  /**
   * 设置当前秒数
   * @param {number} value - 秒数
   */
  function setTime(value) {
    seconds.value = value
  }

  // 组件卸载时清理定时器
  onUnmounted(() => {
    stop()
  })

  return {
    seconds: readonly(seconds),
    isRunning: readonly(isRunning),
    isPaused: readonly(isPaused),
    formattedTime,
    formatTimeFromSeconds: formatTime,
    start,
    stop,
    pause,
    resume,
    togglePause,
    reset,
    setTime,
  }
}

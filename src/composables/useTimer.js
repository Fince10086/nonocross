import { ref, computed, onUnmounted } from 'vue'

export function useTimer() {
  const seconds = ref(0)
  const isRunning = ref(false)
  const isPaused = ref(false)
  let timerInterval = null

  const formattedTime = computed(() => {
    const m = Math.floor(seconds.value / 60).toString().padStart(2, '0')
    const s = (seconds.value % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  })

  function formatTimeFromSeconds(totalSeconds) {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
    const s = (totalSeconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  function start() {
    if (!isRunning.value && !isPaused.value) {
      isRunning.value = true
      timerInterval = setInterval(() => {
        seconds.value++
      }, 1000)
    }
  }

  function stop() {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    isRunning.value = false
  }

  function pause() {
    if (!isRunning.value) return
    isPaused.value = true
    stop()
  }

  function resume() {
    if (!isPaused.value) return
    isPaused.value = false
    start()
  }

  function togglePause() {
    if (isPaused.value) {
      resume()
    } else {
      pause()
    }
  }

  function reset() {
    stop()
    seconds.value = 0
    isPaused.value = false
  }

  function setTime(value) {
    seconds.value = value
  }

  onUnmounted(() => {
    stop()
  })

  return {
    seconds: readonly(seconds),
    isRunning: readonly(isRunning),
    isPaused: readonly(isPaused),
    formattedTime,
    formatTimeFromSeconds,
    start,
    stop,
    pause,
    resume,
    togglePause,
    reset,
    setTime,
  }
}

function readonly(refValue) {
  return computed(() => refValue.value)
}

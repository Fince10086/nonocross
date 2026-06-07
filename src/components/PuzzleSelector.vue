<script setup>
const props = defineProps({
  currentSize: { type: Number, default: 10 },
})

const emit = defineEmits(['changeSize'])
</script>

<template>
  <div class="top-bar">
    <div class="btn-group">
      <button
        class="btn"
        :class="{ active: currentSize === 5 }"
        @click="$emit('changeSize', 5)"
      >
        5×5
      </button>
      <button
        class="btn"
        :class="{ active: currentSize === 10 }"
        @click="$emit('changeSize', 10)"
      >
        10×10
      </button>
      <button
        class="btn"
        :class="{ active: currentSize === 15 }"
        @click="$emit('changeSize', 15)"
      >
        15×15
      </button>
    </div>
  </div>
</template>

<style scoped>
.top-bar {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: center;
}
</style>

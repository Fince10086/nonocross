<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'import'])

const importCode = ref('')
const importError = ref('')
const inputRef = ref(null)

watch(() => props.show, (val) => {
  if (val) {
    importCode.value = ''
    importError.value = ''
    nextTick(() => {
      inputRef.value?.focus()
    })
  }
})

function handleImport() {
  importError.value = ''
  emit('import', importCode.value)
}

function handleClose() {
  emit('close')
}

function setError(msg) {
  importError.value = msg
}

defineExpose({ setError })
</script>

<template>
  <div
    v-if="show"
    class="modal-overlay"
    @click.self="handleClose"
  >
    <div class="modal">
      <h3 class="modal-title">Import Puzzle</h3>
      <p class="modal-desc">Paste the puzzle code below:</p>
      <input
        ref="inputRef"
        v-model="importCode"
        type="text"
        class="modal-input"
        placeholder="10:AAECAwQFBgcICQ=="
        @keyup.enter="handleImport"
      />
      <p v-if="importError" class="modal-error">{{ importError }}</p>
      <div class="modal-actions">
        <button class="btn" @click="handleImport">Import</button>
        <button class="btn" @click="handleClose">Cancel</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.8);
  z-index: 100;
}

.modal {
  background: #fff;
  border: 2px solid #000;
  padding: 24px;
  min-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
}

.modal-desc {
  font-size: 0.875rem;
  margin: 0;
}

.modal-input {
  padding: 8px 12px;
  font-size: 0.875rem;
  font-weight: 600;
  border: 2px solid #000;
  width: 100%;
  box-sizing: border-box;
}

.modal-error {
  font-size: 0.875rem;
  font-weight: 600;
  color: #c00;
  margin: 0;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>

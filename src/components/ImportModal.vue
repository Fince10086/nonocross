<script setup>
import { ref, watch, nextTick } from 'vue'
import { t } from '../i18n.js'

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

function setError(msg) {
  importError.value = msg
}

defineExpose({ setError })
</script>

<template>
  <div
    v-if="show"
    class="modal-overlay"
    @click.self="$emit('close')"
  >
    <div class="modal" style="min-width: 320px; gap: 16px;">
      <h3 class="modal-title">{{ t('importPuzzle') }}</h3>
      <p class="modal-desc">{{ t('pasteCode') }}</p>
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
        <button class="btn" @click="handleImport">{{ t('import') }}</button>
        <button class="btn" @click="$emit('close')">{{ t('cancel') }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-desc {
  font-size: 0.875rem;
  margin: 0;
}

.modal-input {
  padding: 8px 12px;
  font-size: 0.875rem;
  font-weight: 600;
  border: 2px solid #000;
  border-radius: 4px;
  width: 100%;
  box-sizing: border-box;
}

.modal-error {
  font-size: 0.875rem;
  font-weight: 600;
  color: #c00;
  margin: 0;
}
</style>

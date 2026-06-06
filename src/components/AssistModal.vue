<script setup>
const props = defineProps({
  show: { type: Boolean, default: false },
  settings: { type: Object, required: true },
})

const emit = defineEmits(['close', 'toggle'])

function handleClose() {
  emit('close')
}

function handleToggle(key) {
  emit('toggle', key, !props.settings[key])
}
</script>

<template>
  <div
    v-if="show"
    class="modal-overlay"
    @click.self="handleClose"
  >
    <div class="modal">
      <h3 class="modal-title">Assist Settings</h3>

      <div class="settings-list">
        <div class="setting-item" @click="handleToggle('autoMark')">
          <div class="setting-info">
            <span class="setting-name">Auto Mark X</span>
            <span class="setting-desc">Automatically mark empty cells as X when a row/column is completed</span>
          </div>
          <div class="toggle" :class="{ active: settings.autoMark }">
            <div class="toggle-knob"></div>
          </div>
        </div>

        <div class="setting-item" @click="handleToggle('conflictDetect')">
          <div class="setting-info">
            <span class="setting-name">Conflict Detection</span>
            <span class="setting-desc">Highlight hints in red when a row/column contains conflicting cells</span>
          </div>
          <div class="toggle" :class="{ active: settings.conflictDetect }">
            <div class="toggle-knob"></div>
          </div>
        </div>

        <div class="setting-item" @click="handleToggle('derivableHint')">
          <div class="setting-info">
            <span class="setting-name">Derivable Hint</span>
            <span class="setting-desc">Highlight hints in blue when more cells can be logically deduced</span>
          </div>
          <div class="toggle" :class="{ active: settings.derivableHint }">
            <div class="toggle-knob"></div>
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn" @click="handleClose">Close</button>
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
  padding: 20px;
  box-sizing: border-box;
}

.modal {
  background: #fff;
  border: 2px solid #000;
  padding: 24px;
  max-width: 480px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px;
  border: 1px solid #ccc;
  cursor: pointer;
  transition: background 0.15s;
}

.setting-item:hover {
  background: #f5f5f5;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-name {
  font-size: 0.9375rem;
  font-weight: 600;
}

.setting-desc {
  font-size: 0.8rem;
  color: #666;
  line-height: 1.4;
}

.toggle {
  width: 44px;
  height: 24px;
  background: #ccc;
  border-radius: 12px;
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
}

.toggle.active {
  background: #000;
}

.toggle-knob {
  width: 20px;
  height: 20px;
  background: #fff;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.2s;
}

.toggle.active .toggle-knob {
  transform: translateX(20px);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 600px) {
  .modal-overlay {
    padding: 12px;
  }

  .modal {
    padding: 16px;
  }
}
</style>

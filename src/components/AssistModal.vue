<script setup>
import { t } from '../i18n.js'

const props = defineProps({
  show: { type: Boolean, default: false },
  settings: { type: Object, required: true },
})

const emit = defineEmits(['close', 'toggle'])

function handleToggle(key) {
  emit('toggle', key, !props.settings[key])
}
</script>

<template>
  <div
    v-if="show"
    class="modal-overlay"
    @click.self="$emit('close')"
  >
    <div class="modal" style="max-width: 480px; width: 100%; gap: 20px;">
      <h3 class="modal-title">{{ t('assistSettings') }}</h3>

      <div class="settings-list">
        <div class="setting-item" @click="handleToggle('autoMark')">
          <div class="setting-info">
            <span class="setting-name">{{ t('autoMark') }}</span>
            <span class="setting-desc">{{ t('autoMarkDesc') }}</span>
          </div>
          <div class="toggle" :class="{ active: settings.autoMark }">
            <div class="toggle-knob"></div>
          </div>
        </div>

        <div class="setting-item" @click="handleToggle('conflictDetect')">
          <div class="setting-info">
            <span class="setting-name">{{ t('conflictDetection') }}</span>
            <span class="setting-desc">{{ t('conflictDetectionDesc') }}</span>
          </div>
          <div class="toggle" :class="{ active: settings.conflictDetect }">
            <div class="toggle-knob"></div>
          </div>
        </div>

        <div class="setting-item" @click="handleToggle('derivableHint')">
          <div class="setting-info">
            <span class="setting-name">{{ t('derivableHint') }}</span>
            <span class="setting-desc">{{ t('derivableHintDesc') }}</span>
          </div>
          <div class="toggle" :class="{ active: settings.derivableHint }">
            <div class="toggle-knob"></div>
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn" @click="$emit('close')">{{ t('close') }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
</style>

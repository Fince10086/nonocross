<script setup>
import { t } from '../i18n.js'

defineProps({
  show: { type: Boolean, default: false },
})
</script>

<template>
  <div
    v-if="show"
    class="modal-overlay"
    @click.self="$emit('close')"
  >
    <div class="modal help-modal">
      <h3 class="modal-title">{{ t('howToPlay') }}</h3>

      <div class="modal-content thin-scrollbar">
        <p class="intro">
          <a href="https://en.wikipedia.org/wiki/Nonogram" target="_blank">Nonogram</a>
          {{ t('nonogramDesc') }}
        </p>

        <h4>{{ t('keyboardShortcuts') }}</h4>

        <h5>{{ t('moveAndFill') }}</h5>
        <div class="shortcut-table">
          <div class="shortcut-row">
            <span class="key">↑↓←→</span>
            <span class="desc">{{ t('moveSelection') }}</span>
          </div>
          <div class="shortcut-row">
            <span class="key">W A S D</span>
            <span class="desc">{{ t('moveSelection') }}</span>
          </div>
          <div class="shortcut-row">
            <span class="key">Space</span>
            <span class="desc">{{ t('fillClearByMode') }}</span>
          </div>
          <div class="shortcut-row">
            <span class="key">F</span>
            <span class="desc">{{ t('fillDirect') }}</span>
          </div>
          <div class="shortcut-row">
            <span class="key">X</span>
            <span class="desc">{{ t('markXDirect') }}</span>
          </div>
        </div>

        <h5>{{ t('gameControls') }}</h5>
        <div class="shortcut-table">
          <div class="shortcut-row">
            <span class="key">P</span>
            <span class="desc">{{ t('pauseResume') }}</span>
          </div>
          <div class="shortcut-row">
            <span class="key">Ctrl+Z</span>
            <span class="desc">{{ t('undoShort') }}</span>
          </div>
          <div class="shortcut-row">
            <span class="key">R</span>
            <span class="desc">{{ t('restartShort') }}</span>
          </div>
          <div class="shortcut-row">
            <span class="key">Ctrl / Cmd</span>
            <span class="desc">{{ t('holdToggleMode') }}</span>
          </div>
        </div>

        <h4>{{ t('mouseTouch') }}</h4>
        <ul class="tips">
          <li>{{ t('leftClickFill') }}</li>
          <li>{{ t('dragFillMultiple') }}</li>
          <li>{{ t('longPressToggle') }}</li>
        </ul>
      </div>

      <div class="modal-actions">
        <button class="btn" @click="$emit('close')">{{ t('close') }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.help-modal {
  max-width: 480px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
}

.modal-content {
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  font-size: 0.875rem;
  line-height: 1.6;
}

.intro {
  margin: 0 0 16px 0;
  color: #333;
}

.intro a {
  color: #000;
  font-weight: 600;
}

h4 {
  font-size: 1rem;
  font-weight: 700;
  margin: 16px 0 8px 0;
  border-bottom: 1px solid #ccc;
  padding-bottom: 4px;
}

h5 {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 12px 0 6px 0;
  color: #555;
}

.shortcut-table {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.shortcut-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 3px 0;
}

.key {
  font-family: 'Outfit', monospace;
  font-size: 0.8rem;
  font-weight: 700;
  background: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 3px;
  padding: 2px 8px;
  min-width: 80px;
  text-align: center;
  flex-shrink: 0;
}

.desc {
  color: #333;
}

.tips {
  margin: 0;
  padding-left: 18px;
  color: #333;
}

.tips li {
  margin-bottom: 4px;
}

@media (max-width: 600px) {
  .help-modal {
    max-height: 90vh;
  }
}
</style>

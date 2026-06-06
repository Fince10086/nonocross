<script setup>
const props = defineProps({
  show: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

function handleClose() {
  emit('close')
}
</script>

<template>
  <div
    v-if="show"
    class="modal-overlay"
    @click.self="handleClose"
  >
    <div class="modal">
      <h3 class="modal-title">How to Play</h3>
      
      <div class="modal-content">
        <p class="intro">
          <a href="https://en.wikipedia.org/wiki/Nonogram" target="_blank">Nonogram</a> 
          is a logic puzzle where you fill grid cells according to the numbers on the sides.
          Each number indicates how many consecutive filled cells are in that row/column.
        </p>

        <h4>Keyboard Shortcuts</h4>
        
        <h5>Move &amp; Fill</h5>
        <div class="shortcut-table">
          <div class="shortcut-row">
            <span class="key">↑↓←→</span>
            <span class="desc">Move selection (wrap around)</span>
          </div>
          <div class="shortcut-row">
            <span class="key">W A S D</span>
            <span class="desc">Move selection (wrap around)</span>
          </div>
          <div class="shortcut-row">
            <span class="key">Space</span>
            <span class="desc">Fill / Clear by current mode</span>
          </div>
          <div class="shortcut-row">
            <span class="key">F</span>
            <span class="desc">Fill (clear if already filled)</span>
          </div>
          <div class="shortcut-row">
            <span class="key">X</span>
            <span class="desc">Mark X (clear if already marked)</span>
          </div>
        </div>

        <h5>Game Controls</h5>
        <div class="shortcut-table">
          <div class="shortcut-row">
            <span class="key">P</span>
            <span class="desc">Pause / Resume</span>
          </div>
          <div class="shortcut-row">
            <span class="key">Ctrl+Z</span>
            <span class="desc">Undo</span>
          </div>
          <div class="shortcut-row">
            <span class="key">R</span>
            <span class="desc">Restart</span>
          </div>
          <div class="shortcut-row">
            <span class="key">Ctrl / Cmd</span>
            <span class="desc">Hold to toggle mode (Fill ↔ X)</span>
          </div>
        </div>

        <h4>Mouse / Touch</h4>
        <ul class="tips">
          <li><strong>Left click</strong> to fill, <strong>Right click</strong> to mark X</li>
          <li><strong>Drag</strong> to fill multiple cells at once</li>
          <li><strong>Long press</strong> on mobile to toggle mode</li>
        </ul>
      </div>

      <div class="modal-actions">
        <button class="action-btn" @click="handleClose">Close</button>
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
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  flex-shrink: 0;
}

.modal-content {
  overflow-y: auto;
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

.modal-actions {
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}

.action-btn {
  padding: 8px 16px;
  font-size: 0.875rem;
  font-weight: 600;
  border: 2px solid #000;
  background: #fff;
  color: #000;
  cursor: pointer;
  transition: background 0.15s;
}

.action-btn:hover {
  background: #f0f0f0;
}

@media (max-width: 600px) {
  .modal-overlay {
    padding: 12px;
  }

  .modal {
    padding: 16px;
    max-height: 90vh;
  }
}
</style>

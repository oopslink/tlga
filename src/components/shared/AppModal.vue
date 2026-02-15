<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="state.visible" class="modal-overlay" @click.self="onCancel">
        <div class="modal-box">
          <h3 class="modal-title">{{ state.title }}</h3>
          <p class="modal-message">{{ state.message }}</p>
          <div class="modal-actions">
            <button v-if="state.type === 'confirm'" class="modal-btn cancel" @click="onCancel">取消</button>
            <button class="modal-btn ok" @click="onOk">确定</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { modalState as state } from '@/composables/useModal'

function close(value: boolean) {
  const resolve = state.resolve
  state.visible = false
  state.resolve = null
  resolve?.(value)
}

function onOk() { close(true) }
function onCancel() { close(false) }
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.modal-box {
  background: var(--color-bg-light);
  border-radius: 16px;
  padding: 32px;
  min-width: 340px;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid var(--color-bg-lighter);
}

.modal-title {
  font-size: 18px;
  margin-bottom: 12px;
  color: var(--color-text);
}

.modal-message {
  color: var(--color-text-dim);
  line-height: 1.6;
  margin-bottom: 24px;
  white-space: pre-line;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.modal-btn {
  border: none;
  border-radius: 8px;
  padding: 10px 24px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-btn.ok {
  background: var(--color-primary);
  color: white;
}

.modal-btn.ok:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(233, 69, 96, 0.4);
}

.modal-btn.cancel {
  background: var(--color-bg-lighter);
  color: var(--color-text-dim);
}

.modal-btn.cancel:hover {
  background: var(--color-bg);
  color: var(--color-text);
}

/* Transition */
.modal-enter-active { transition: opacity 0.2s ease; }
.modal-leave-active { transition: opacity 0.15s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .modal-box { animation: modal-in 0.2s ease; }
.modal-leave-active .modal-box { animation: modal-out 0.15s ease; }

@keyframes modal-in {
  from { transform: scale(0.92); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
@keyframes modal-out {
  from { transform: scale(1); opacity: 1; }
  to { transform: scale(0.92); opacity: 0; }
}
</style>

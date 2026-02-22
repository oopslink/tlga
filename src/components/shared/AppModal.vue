<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="state.visible" class="modal-overlay" @click.self="onCancel">
        <Transition name="modal-bounce" appear>
          <div v-if="state.visible" class="modal-container">
            <div class="modal-box" :class="`modal-${state.type}`">
              <!-- Icon -->
              <div class="modal-icon">
                <div class="icon-circle">
                  <span class="icon-emoji">{{ getIcon(state.type) }}</span>
                </div>
              </div>

              <!-- Content -->
              <div class="modal-content">
                <h3 class="modal-title">{{ state.title }}</h3>
                <p class="modal-message">{{ state.message }}</p>
                <input
                  v-if="state.type === 'prompt'"
                  ref="promptInput"
                  class="modal-input"
                  v-model="state.promptValue"
                  @keyup.enter="onOk"
                  placeholder="请输入..."
                />
              </div>

              <!-- Actions -->
              <div class="modal-actions">
                <button
                  v-if="state.type === 'confirm' || state.type === 'prompt'"
                  class="modal-btn btn-cancel"
                  @click="onCancel"
                >
                  <span class="btn-icon">✕</span>
                  <span>取消</span>
                </button>
                <button
                  class="modal-btn btn-primary"
                  :class="`btn-${state.type}`"
                  @click="onOk"
                  :disabled="state.type === 'prompt' && !state.promptValue.trim()"
                >
                  <span class="btn-icon">{{ state.type === 'confirm' || state.type === 'prompt' ? '✓' : '→' }}</span>
                  <span>{{ state.type === 'confirm' || state.type === 'prompt' ? '确定' : '好的' }}</span>
                </button>
              </div>

              <!-- Decorative elements -->
              <div class="modal-decoration decoration-1"></div>
              <div class="modal-decoration decoration-2"></div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { modalState as state } from '@/composables/useModal'
import type { ModalType } from '@/composables/useModal'

const promptInput = ref<HTMLInputElement | null>(null)

watch(() => state.visible, (visible) => {
  if (visible && state.type === 'prompt') {
    nextTick(() => promptInput.value?.focus())
  }
})

function getIcon(type: ModalType): string {
  const icons: Record<string, string> = {
    success: '🎉',
    error: '😟',
    warning: '⚠️',
    info: '💡',
    confirm: '🤔',
    prompt: '✏️'
  }
  return icons[type] || '💡'
}

function close(value: boolean) {
  if (state.type === 'prompt') {
    const promptResolve = state.promptResolve
    state.visible = false
    state.promptResolve = null
    promptResolve?.(value ? state.promptValue.trim() : null)
    return
  }
  const resolve = state.resolve
  state.visible = false
  state.resolve = null
  resolve?.(value)
}

function onOk() {
  close(true)
}

function onCancel() {
  close(false)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(8px);
  padding: 20px;
}

.modal-container {
  width: 100%;
  max-width: 440px;
  position: relative;
}

.modal-box {
  background: white;
  border-radius: 24px;
  padding: 40px 32px 32px;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.05),
    0 20px 60px rgba(0, 0, 0, 0.4),
    0 0 120px rgba(255, 107, 157, 0.15);
  position: relative;
  overflow: hidden;
}

/* Icon */
.modal-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.icon-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  position: relative;
  animation: iconPulse 2s ease-in-out infinite;
}

.modal-success .icon-circle { background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%); }
.modal-error .icon-circle { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
.modal-warning .icon-circle { background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%); }
.modal-info .icon-circle { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); }
.modal-confirm .icon-circle { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }

@keyframes iconPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.icon-emoji {
  position: relative;
  z-index: 1;
  animation: iconBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes iconBounce {
  0% { transform: scale(0) rotate(-180deg); }
  50% { transform: scale(1.2) rotate(10deg); }
  100% { transform: scale(1) rotate(0deg); }
}

/* Content */
.modal-content {
  text-align: center;
  margin-bottom: 28px;
}

.modal-title {
  font-family: 'Fredoka', sans-serif;
  font-size: 24px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 12px 0;
  line-height: 1.3;
}

.modal-message {
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
  white-space: pre-line;
}

.modal-input {
  width: 100%;
  margin-top: 16px;
  padding: 12px 16px;
  border: 2px solid rgba(255, 107, 157, 0.2);
  border-radius: 12px;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  color: #2d3748;
  background: #f8fafc;
  outline: none;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.modal-input:focus {
  border-color: var(--color-primary, #ff6b9d);
  background: white;
  box-shadow: 0 0 0 4px rgba(255, 107, 157, 0.1);
}

.modal-prompt .icon-circle { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); }
.btn-prompt { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); }

/* Actions */
.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.modal-btn {
  flex: 1;
  min-width: 120px;
  border: none;
  border-radius: 14px;
  padding: 14px 24px;
  font-family: 'Fredoka', sans-serif;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
}

.modal-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.modal-btn:hover::before {
  width: 300px;
  height: 300px;
}

.btn-icon {
  font-size: 18px;
  transition: transform 0.3s;
  position: relative;
  z-index: 1;
}

.modal-btn:hover .btn-icon {
  transform: scale(1.2) rotate(15deg);
}

.modal-btn span {
  position: relative;
  z-index: 1;
}

.btn-cancel {
  background: #f1f5f9;
  color: #64748b;
}

.btn-cancel:hover {
  background: #e2e8f0;
  color: #475569;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.btn-primary {
  color: white;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-success { background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%); }
.btn-error { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
.btn-warning { background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%); }
.btn-info { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); }
.btn-confirm { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }

/* Decorative elements */
.modal-decoration {
  position: absolute;
  border-radius: 50%;
  opacity: 0.15;
  pointer-events: none;
}

.decoration-1 {
  width: 150px;
  height: 150px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  top: -75px;
  right: -75px;
  animation: float1 6s ease-in-out infinite;
}

.decoration-2 {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  bottom: -50px;
  left: -50px;
  animation: float2 8s ease-in-out infinite;
}

@keyframes float1 {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(10px, 10px) rotate(180deg); }
}

@keyframes float2 {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(-10px, -10px) rotate(-180deg); }
}

/* Transitions */
.modal-fade-enter-active {
  transition: opacity 0.3s ease;
}

.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-bounce-enter-active {
  animation: modalBounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.modal-bounce-leave-active {
  animation: modalBounceOut 0.3s cubic-bezier(0.6, -0.28, 0.735, 0.045);
}

@keyframes modalBounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3) translateY(-100px) rotate(-10deg);
  }
  50% {
    transform: scale(1.05) translateY(0) rotate(2deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0) rotate(0deg);
  }
}

@keyframes modalBounceOut {
  0% {
    opacity: 1;
    transform: scale(1) translateY(0) rotate(0deg);
  }
  100% {
    opacity: 0;
    transform: scale(0.5) translateY(50px) rotate(10deg);
  }
}

/* Mobile responsive */
@media (max-width: 480px) {
  .modal-box {
    padding: 32px 24px 24px;
  }

  .icon-circle {
    width: 64px;
    height: 64px;
    font-size: 32px;
  }

  .modal-title {
    font-size: 20px;
  }

  .modal-message {
    font-size: 14px;
  }

  .modal-actions {
    flex-direction: column;
  }

  .modal-btn {
    width: 100%;
    min-width: unset;
  }
}
</style>

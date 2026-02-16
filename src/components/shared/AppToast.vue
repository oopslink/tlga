<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast-item"
          :class="`toast-${toast.type}`"
          @click="removeToast(toast.id)"
        >
          <div class="toast-icon">
            <span>{{ getIcon(toast.type) }}</span>
          </div>
          <div class="toast-content">
            <p class="toast-message">{{ toast.message }}</p>
          </div>
          <button class="toast-close" @click.stop="removeToast(toast.id)">
            <span>×</span>
          </button>
          <div class="toast-progress" :style="{ animationDuration: `${toast.duration}ms` }"></div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { toastState, useToast } from '@/composables/useToast'
import type { ToastType } from '@/composables/useToast'

const toasts = computed(() => toastState.toasts)
const { remove } = useToast()

function getIcon(type: ToastType): string {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  }
  return icons[type] || 'ℹ'
}

function removeToast(id: number) {
  remove(id)
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.toast-item {
  pointer-events: auto;
  background: white;
  border-radius: 16px;
  padding: 16px;
  min-width: 300px;
  max-width: 400px;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.05),
    0 10px 30px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.toast-item:hover {
  transform: translateX(-8px);
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.08),
    0 15px 40px rgba(0, 0, 0, 0.25);
}

.toast-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  flex-shrink: 0;
  color: white;
  position: relative;
  animation: toastIconPop 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes toastIconPop {
  0% { transform: scale(0) rotate(-180deg); }
  50% { transform: scale(1.2) rotate(10deg); }
  100% { transform: scale(1) rotate(0deg); }
}

.toast-success .toast-icon { background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%); }
.toast-error .toast-icon { background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%); }
.toast-warning .toast-icon { background: linear-gradient(135deg, #faad14 0%, #ffc53d 100%); }
.toast-info .toast-icon { background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%); }

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-message {
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
  line-height: 1.5;
  word-break: break-word;
}

.toast-close {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  border: none;
  background: #f1f5f9;
  color: #64748b;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
  padding: 0;
}

.toast-close:hover {
  background: #e2e8f0;
  color: #475569;
  transform: rotate(90deg) scale(1.1);
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  width: 100%;
  transform-origin: left;
  animation: toastProgress linear forwards;
}

.toast-success .toast-progress { background: linear-gradient(90deg, #52c41a 0%, #73d13d 100%); }
.toast-error .toast-progress { background: linear-gradient(90deg, #ff4d4f 0%, #ff7875 100%); }
.toast-warning .toast-progress { background: linear-gradient(90deg, #faad14 0%, #ffc53d 100%); }
.toast-info .toast-progress { background: linear-gradient(90deg, #1890ff 0%, #40a9ff 100%); }

@keyframes toastProgress {
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
}

/* Transitions */
.toast-enter-active {
  animation: toastSlideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.toast-leave-active {
  animation: toastSlideOut 0.3s cubic-bezier(0.6, -0.28, 0.735, 0.045);
}

@keyframes toastSlideIn {
  from {
    opacity: 0;
    transform: translateX(400px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes toastSlideOut {
  from {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateX(400px) scale(0.8);
  }
}

/* Mobile responsive */
@media (max-width: 640px) {
  .toast-container {
    top: 70px;
    right: 12px;
    left: 12px;
  }

  .toast-item {
    min-width: unset;
    max-width: unset;
  }

  @keyframes toastSlideIn {
    from {
      opacity: 0;
      transform: translateY(-100px) scale(0.8);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes toastSlideOut {
    from {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    to {
      opacity: 0;
      transform: translateY(-100px) scale(0.8);
    }
  }
}
</style>

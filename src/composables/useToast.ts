import { reactive } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: number
  message: string
  type: ToastType
  duration: number
}

export const toastState = reactive<{
  toasts: ToastItem[]
}>({
  toasts: []
})

let toastId = 0

export function useToast() {
  function show(message: string, type: ToastType = 'info', duration = 3000) {
    const id = ++toastId
    const toast: ToastItem = { id, message, type, duration }

    toastState.toasts.push(toast)

    if (duration > 0) {
      setTimeout(() => {
        remove(id)
      }, duration)
    }

    return id
  }

  function remove(id: number) {
    const index = toastState.toasts.findIndex(t => t.id === id)
    if (index !== -1) {
      toastState.toasts.splice(index, 1)
    }
  }

  function success(message: string, duration = 3000) {
    return show(message, 'success', duration)
  }

  function error(message: string, duration = 4000) {
    return show(message, 'error', duration)
  }

  function warning(message: string, duration = 3500) {
    return show(message, 'warning', duration)
  }

  function info(message: string, duration = 3000) {
    return show(message, 'info', duration)
  }

  function clear() {
    toastState.toasts = []
  }

  return {
    show,
    remove,
    success,
    error,
    warning,
    info,
    clear
  }
}

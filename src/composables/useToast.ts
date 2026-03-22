export type ToastType = 'success' | 'error' | 'warning' | 'info'

export function useToast() {
  function show(message: string, type: ToastType = 'info', duration = 3000) {
    const icon = type === 'success' ? 'success' : type === 'error' ? 'error' : 'none'
    uni.showToast({ title: message, icon, duration })
  }

  const success = (msg: string) => show(msg, 'success', 3000)
  const error = (msg: string) => show(msg, 'error', 4000)
  const warning = (msg: string) => show(msg, 'warning', 3500)
  const info = (msg: string) => show(msg, 'info', 3000)

  function clear() {
    uni.hideToast()
  }

  return { show, success, error, warning, info, clear }
}

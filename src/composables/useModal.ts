import { reactive } from 'vue'

export type ModalType = 'success' | 'error' | 'warning' | 'info' | 'confirm' | 'prompt'

export interface ModalState {
  visible: boolean
  title: string
  message: string
  type: ModalType
  resolve: ((value: boolean) => void) | null
  promptValue: string
  promptResolve: ((value: string | null) => void) | null
}

export const modalState = reactive<ModalState>({
  visible: false,
  title: '',
  message: '',
  type: 'info',
  resolve: null,
  promptValue: '',
  promptResolve: null,
})

export function useModal() {
  function showAlert(message: string, title = '提示', type: ModalType = 'info'): Promise<void> {
    return new Promise((resolve) => {
      modalState.visible = true
      modalState.title = title
      modalState.message = message
      modalState.type = type
      modalState.resolve = () => resolve()
    })
  }

  function showConfirm(message: string, title = '确认'): Promise<boolean> {
    return new Promise((resolve) => {
      modalState.visible = true
      modalState.title = title
      modalState.message = message
      modalState.type = 'confirm'
      modalState.resolve = resolve
    })
  }

  function showSuccess(message: string, title = '成功'): Promise<void> {
    return showAlert(message, title, 'success')
  }

  function showError(message: string, title = '错误'): Promise<void> {
    return showAlert(message, title, 'error')
  }

  function showWarning(message: string, title = '警告'): Promise<void> {
    return showAlert(message, title, 'warning')
  }

  function showInfo(message: string, title = '提示'): Promise<void> {
    return showAlert(message, title, 'info')
  }

  function showPrompt(message: string, title = '请输入', defaultValue = ''): Promise<string | null> {
    return new Promise((resolve) => {
      modalState.visible = true
      modalState.title = title
      modalState.message = message
      modalState.type = 'prompt'
      modalState.promptValue = defaultValue
      modalState.promptResolve = resolve
      modalState.resolve = null
    })
  }

  return {
    showAlert,
    showConfirm,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showPrompt
  }
}

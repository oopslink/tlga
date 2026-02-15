import { reactive } from 'vue'

export interface ModalState {
  visible: boolean
  title: string
  message: string
  type: 'alert' | 'confirm'
  resolve: ((value: boolean) => void) | null
}

export const modalState = reactive<ModalState>({
  visible: false,
  title: '',
  message: '',
  type: 'alert',
  resolve: null,
})

export function useModal() {
  function showAlert(message: string, title = '提示'): Promise<void> {
    return new Promise((resolve) => {
      modalState.visible = true
      modalState.title = title
      modalState.message = message
      modalState.type = 'alert'
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

  return { showAlert, showConfirm }
}

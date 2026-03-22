export function useModal() {
  function showAlert(message: string, title = '提示'): Promise<void> {
    return new Promise(resolve => {
      uni.showModal({
        title,
        content: message,
        showCancel: false,
        success: () => resolve(),
      })
    })
  }

  function showConfirm(message: string, title = '确认'): Promise<boolean> {
    return new Promise(resolve => {
      uni.showModal({
        title,
        content: message,
        success: ({ confirm }) => resolve(confirm),
        fail: () => resolve(false),
      })
    })
  }

  // uni.showModal supports editable:true (WeChat Mini Program base library 2.17.3+)
  function showPrompt(message: string, title = '请输入', defaultValue = ''): Promise<string | null> {
    return new Promise(resolve => {
      uni.showModal({
        title,
        content: message,
        editable: true,
        placeholderText: defaultValue,
        success: ({ confirm, content }) => resolve(confirm ? (content ?? '') : null),
        fail: () => resolve(null),
      })
    })
  }

  return { showAlert, showConfirm, showPrompt }
}

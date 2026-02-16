import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'app_password'
const AUTH_SESSION_KEY = 'is_authenticated'

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false)
  const hasPassword = ref(false)

  // 初始化：检查是否有密码
  function init() {
    const storedPassword = localStorage.getItem(STORAGE_KEY)
    hasPassword.value = !!storedPassword

    // 检查会话状态（刷新页面后仍保持登录）
    const sessionAuth = sessionStorage.getItem(AUTH_SESSION_KEY)
    isAuthenticated.value = sessionAuth === 'true'
  }

  // 设置密码（第一次）
  function setPassword(password: string): boolean {
    if (!password || password.length < 4) {
      return false
    }

    // 简单加密（实际项目应使用更安全的加密方式）
    const encrypted = btoa(password)
    localStorage.setItem(STORAGE_KEY, encrypted)
    hasPassword.value = true
    isAuthenticated.value = true
    sessionStorage.setItem(AUTH_SESSION_KEY, 'true')
    return true
  }

  // 验证密码
  function verifyPassword(password: string): boolean {
    const storedPassword = localStorage.getItem(STORAGE_KEY)
    if (!storedPassword) {
      return false
    }

    const encrypted = btoa(password)
    const isValid = encrypted === storedPassword

    if (isValid) {
      isAuthenticated.value = true
      sessionStorage.setItem(AUTH_SESSION_KEY, 'true')
    }

    return isValid
  }

  // 登出
  function logout() {
    isAuthenticated.value = false
    sessionStorage.removeItem(AUTH_SESSION_KEY)
  }

  // 重置密码（需要先登录）
  function resetPassword(oldPassword: string, newPassword: string): boolean {
    if (!isAuthenticated.value) {
      return false
    }

    const storedPassword = localStorage.getItem(STORAGE_KEY)
    if (!storedPassword) {
      return false
    }

    const oldEncrypted = btoa(oldPassword)
    if (oldEncrypted !== storedPassword) {
      return false
    }

    if (!newPassword || newPassword.length < 4) {
      return false
    }

    const newEncrypted = btoa(newPassword)
    localStorage.setItem(STORAGE_KEY, newEncrypted)
    return true
  }

  // 清除所有数据（仅用于开发/调试）
  function clearAll() {
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(AUTH_SESSION_KEY)
    hasPassword.value = false
    isAuthenticated.value = false
  }

  return {
    isAuthenticated: computed(() => isAuthenticated.value),
    hasPassword: computed(() => hasPassword.value),
    init,
    setPassword,
    verifyPassword,
    logout,
    resetPassword,
    clearAll,
  }
})

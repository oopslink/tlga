import { defineStore, setActivePinia } from 'pinia'
import { ref, computed } from 'vue'
import { pinia } from './pinia-instance'

const STORAGE_KEY = 'app_password'
const AUTH_SESSION_KEY = 'is_authenticated'

// WeChat Mini Program does not support btoa/atob (Web API)
// Use hasB/hasC flags to correctly handle padding for all input lengths
function toBase64(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
  let result = ''
  let i = 0
  while (i < str.length) {
    const a = str.charCodeAt(i++)
    const hasB = i < str.length
    const b = hasB ? str.charCodeAt(i++) : 0
    const hasC = i < str.length
    const c = hasC ? str.charCodeAt(i++) : 0
    const bits = (a << 16) | (b << 8) | c
    result += chars[(bits >> 18) & 0x3f]
    result += chars[(bits >> 12) & 0x3f]
    result += hasB ? chars[(bits >> 6) & 0x3f] : '='
    result += hasC ? chars[bits & 0x3f] : '='
  }
  return result
}

const _useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false)
  const hasPassword = ref(false)

  function init() {
    const storedPassword = wx.getStorageSync(STORAGE_KEY)
    hasPassword.value = !!storedPassword
    const sessionAuth = wx.getStorageSync(AUTH_SESSION_KEY)
    isAuthenticated.value = sessionAuth === 'true'
  }

  function setPassword(password: string): boolean {
    if (!password || password.length < 4) return false
    const encrypted = toBase64(password)
    wx.setStorageSync(STORAGE_KEY, encrypted)
    hasPassword.value = true
    isAuthenticated.value = true
    wx.setStorageSync(AUTH_SESSION_KEY, 'true')
    return true
  }

  function verifyPassword(password: string): boolean {
    const storedPassword = wx.getStorageSync(STORAGE_KEY)
    if (!storedPassword) return false
    const encrypted = toBase64(password)
    const isValid = encrypted === storedPassword
    if (isValid) {
      isAuthenticated.value = true
      wx.setStorageSync(AUTH_SESSION_KEY, 'true')
    }
    return isValid
  }

  function logout() {
    isAuthenticated.value = false
    wx.removeStorageSync(AUTH_SESSION_KEY)
  }

  function resetPassword(oldPassword: string, newPassword: string): boolean {
    if (!isAuthenticated.value) return false
    const storedPassword = wx.getStorageSync(STORAGE_KEY)
    if (!storedPassword) return false
    if (toBase64(oldPassword) !== storedPassword) return false
    if (!newPassword || newPassword.length < 4) return false
    wx.setStorageSync(STORAGE_KEY, toBase64(newPassword))
    return true
  }

  function clearAll() {
    wx.removeStorageSync(STORAGE_KEY)
    wx.removeStorageSync(AUTH_SESSION_KEY)
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

export function useAuthStore() {
  setActivePinia(pinia)
  return _useAuthStore()
}

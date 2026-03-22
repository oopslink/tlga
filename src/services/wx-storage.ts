import type { StorageService } from './storage'

const PREFIX = 'tlgapp:'

export class WxStorageService implements StorageService {
  async read<T>(path: string): Promise<T | null> {
    try {
      const raw = wx.getStorageSync(PREFIX + path)
      // wx.getStorageSync returns '' or undefined for missing keys
      if (raw == null || raw === '') return null
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  async write<T>(path: string, data: T): Promise<void> {
    wx.setStorageSync(PREFIX + path, JSON.stringify(data))
  }

  async exists(path: string): Promise<boolean> {
    const val = wx.getStorageSync(PREFIX + path)
    return val !== undefined && val !== ''
  }

  async list(dir: string): Promise<string[]> {
    const info = wx.getStorageInfoSync()
    const prefixedDir = PREFIX + dir
    return info.keys
      .filter((k: string) => k.startsWith(prefixedDir))
      .map((k: string) => k.slice(PREFIX.length))
  }
}

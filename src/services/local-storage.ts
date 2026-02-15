import type { StorageService } from './storage'

const PREFIX = 'tlgapp:'

/**
 * localStorage fallback implementation of StorageService.
 * Stores data as JSON strings with a prefix.
 */
export class LocalStorageService implements StorageService {
  async read<T>(path: string): Promise<T | null> {
    try {
      const raw = localStorage.getItem(PREFIX + path)
      if (raw === null) return null
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  async write<T>(path: string, data: T): Promise<void> {
    localStorage.setItem(PREFIX + path, JSON.stringify(data))
  }

  async exists(path: string): Promise<boolean> {
    return localStorage.getItem(PREFIX + path) !== null
  }

  async list(dir: string): Promise<string[]> {
    const prefix = PREFIX + dir
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        keys.push(key.slice(PREFIX.length))
      }
    }
    return keys
  }
}

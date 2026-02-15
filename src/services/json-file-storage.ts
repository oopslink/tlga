import type { StorageService } from './storage'

const API_BASE = '/api/data'

/**
 * StorageService implementation using the Vite dev server API.
 * Reads/writes JSON files under the data/ directory.
 */
export class JsonFileStorage implements StorageService {
  async read<T>(path: string): Promise<T | null> {
    try {
      const res = await fetch(`${API_BASE}/${path}`)
      if (!res.ok) {
        if (res.status === 404) return null
        throw new Error(`Failed to read ${path}: ${res.statusText}`)
      }
      return await res.json() as T
    } catch {
      console.warn(`JsonFileStorage: failed to read ${path}`)
      return null
    }
  }

  async write<T>(path: string, data: T): Promise<void> {
    const res = await fetch(`${API_BASE}/${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data, null, 2),
    })
    if (!res.ok) {
      throw new Error(`Failed to write ${path}: ${res.statusText}`)
    }
  }

  async exists(path: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/${path}`, { method: 'HEAD' })
      return res.ok
    } catch {
      return false
    }
  }

  async list(dir: string): Promise<string[]> {
    try {
      const res = await fetch(`${API_BASE}/${dir}?list=true`)
      if (!res.ok) return []
      return await res.json() as string[]
    } catch {
      return []
    }
  }
}

import type { StorageService } from './storage'
import { JsonFileStorage } from './json-file-storage'
import { LocalStorageService } from './local-storage'

/**
 * Creates the appropriate storage service based on environment
 * - Development: Uses JsonFileStorage (API endpoints)
 * - Production: Uses LocalStorageService (localStorage)
 */
export function createStorage(): StorageService {
  // Check if we're in production or if the API is not available
  const isProduction = import.meta.env.PROD

  if (isProduction) {
    // Always use localStorage in production (Vercel, GitHub Pages, etc.)
    return new LocalStorageService()
  } else {
    // In development, use JSON file storage with API
    return new JsonFileStorage()
  }
}

// Export a singleton instance
export const storage = createStorage()

/**
 * StorageService interface for reading/writing JSON data
 */
export interface StorageService {
  read<T>(path: string): Promise<T | null>
  write<T>(path: string, data: T): Promise<void>
  exists(path: string): Promise<boolean>
  list(dir: string): Promise<string[]>
}

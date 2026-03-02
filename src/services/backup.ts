import { storage } from './storage-factory'
import { PREFIX } from './local-storage'

export interface BackupData {
  version: string
  exportedAt: string
  data: Record<string, unknown>
}

export async function exportAllData(): Promise<BackupData> {
  const allData: Record<string, unknown> = {}

  const paths = await storage.list('')
  for (const path of paths) {
    const value = await storage.read(path)
    if (value !== null) {
      allData[path] = value
    }
  }

  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    data: allData,
  }
}

export async function importAllData(backup: BackupData): Promise<{ imported: number; skipped: number }> {
  let imported = 0
  let skipped = 0

  for (const [path, value] of Object.entries(backup.data)) {
    const exists = await storage.exists(path)
    if (exists) {
      skipped++
      continue
    }
    await storage.write(path, value)
    imported++
  }

  return { imported, skipped }
}

// replaceAllData 直接操作 localStorage，属于生产环境专用操作（不支持开发环境 JsonFileStorage）
// 采用快照+原子写入策略：先备份现有数据，再删除，若写入失败则回滚
export function replaceAllData(backup: BackupData): void {
  // 1. 快照现有数据
  const snapshot: Array<[string, string]> = []
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(PREFIX)) {
      keysToRemove.push(key)
      const value = localStorage.getItem(key)
      if (value !== null) snapshot.push([key, value])
    }
  }

  // 2. 删除现有数据
  for (const key of keysToRemove) {
    localStorage.removeItem(key)
  }

  // 3. 写入新数据，失败时回滚
  try {
    for (const [path, value] of Object.entries(backup.data)) {
      const key = PREFIX + path
      localStorage.setItem(key, JSON.stringify(value))
    }
  } catch (e) {
    // 回滚：清理部分写入，恢复快照
    for (const key of keysToRemove) {
      localStorage.removeItem(key)
    }
    for (const [key, value] of snapshot) {
      localStorage.setItem(key, value)
    }
    throw e
  }
}

export function downloadBackup(backup: BackupData): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tlga-backup-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function validateBackupFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string)
        if (
          !json.version ||
          typeof json.data !== 'object' ||
          Array.isArray(json.data) ||
          json.data === null
        ) {
          reject(new Error('无效的备份文件格式'))
          return
        }
        resolve(json as BackupData)
      } catch {
        reject(new Error('无法解析 JSON 文件'))
      }
    }
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsText(file)
  })
}

const PREFIX = 'tlgapp:'

export interface BackupData {
  version: string
  exportedAt: string
  data: Record<string, unknown>
}

export async function exportAllData(): Promise<BackupData> {
  const allData: Record<string, unknown> = {}
  
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(PREFIX)) {
      keys.push(key)
    }
  }
  
  for (const key of keys) {
    const path = key.slice(PREFIX.length)
    const raw = localStorage.getItem(key)
    if (raw) {
      try {
        allData[path] = JSON.parse(raw)
      } catch {
        allData[path] = raw
      }
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
    const key = PREFIX + path
    
    if (localStorage.getItem(key) !== null) {
      skipped++
      continue
    }
    
    localStorage.setItem(key, JSON.stringify(value))
    imported++
  }
  
  return { imported, skipped }
}

export async function replaceAllData(backup: BackupData): Promise<void> {
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(PREFIX)) {
      keysToRemove.push(key)
    }
  }
  
  for (const key of keysToRemove) {
    localStorage.removeItem(key)
  }
  
  for (const [path, value] of Object.entries(backup.data)) {
    const key = PREFIX + path
    localStorage.setItem(key, JSON.stringify(value))
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
        if (!json.version || !json.data) {
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

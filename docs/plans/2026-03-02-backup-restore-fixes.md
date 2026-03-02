# Backup & Restore Bug Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 修复数据备份恢复功能中的 7 个 Critical/Important 问题。

**Architecture:** 涉及两个文件：`src/services/backup.ts`（服务层）和 `src/components/settings/BackupRestore.vue`（UI 层）。同时需要修改 `src/services/local-storage.ts` 导出 PREFIX 常量。

**Tech Stack:** Vue 3, TypeScript, Pinia, localStorage

---

### Task 1: 导出 PREFIX 常量，修复重复定义问题

**[Critical #1 — 重复的 PREFIX 常量]**

**Files:**
- Modify: `src/services/local-storage.ts:3`

**Step 1: 修改 local-storage.ts，导出 PREFIX**

```ts
// 将第3行的：
const PREFIX = 'tlgapp:'
// 改为：
export const PREFIX = 'tlgapp:'
```

---

### Task 2: 重构 backup.ts 使用存储抽象层

**[Critical #1 — 绕过存储抽象层]**

`storage.list('')` 在两种环境下均可枚举所有数据路径：
- 开发环境（JsonFileStorage）：调用 `/api/data/?list=true`，递归列举 data/ 目录下所有 JSON 文件
- 生产环境（LocalStorageService）：扫描所有 `tlgapp:` 前缀的 localStorage key

**Files:**
- Modify: `src/services/backup.ts`

**Step 1: 重写 backup.ts**

完整替换文件内容：

```ts
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
```

---

### Task 3: 修复 BackupRestore.vue 的 4 个 Important 问题

**[Important #4 #5 #6 #7]**

**Files:**
- Modify: `src/components/settings/BackupRestore.vue`

**Step 1: 修复 handleFileSelect — 验证失败时重置 input**

在 catch 块中添加 fileInput 重置（当前代码 line 122-127）：

```ts
  } catch (e) {
    message.value = '文件验证失败: ' + (e as Error).message
    messageType.value = 'error'
    selectedFile.value = null
    previewData.value = null
    if (fileInput.value) {       // 新增：重置原生 input，确保同一文件可再次触发 change 事件
      fileInput.value.value = ''
    }
  }
```

**Step 2: 修复 handleImportReplace — 增强确认对话框 + 自动刷新页面**

```ts
async function handleImportReplace() {
  if (!previewData.value) return

  const confirmed = await showConfirm(
    '此操作将完全替换所有现有数据，且无法撤销！\n\n请确保已导出当前数据的备份，再继续操作。',
    '⚠️ 危险操作 - 无法撤销'
  )

  if (!confirmed) return

  importing.value = true
  message.value = ''

  try {
    replaceAllData(previewData.value)
    message.value = '数据已完全替换！正在重新加载页面...'
    messageType.value = 'success'
    selectedFile.value = null
    previewData.value = null

    if (fileInput.value) {
      fileInput.value.value = ''
    }

    // 自动重新加载，使 Pinia store 从新数据初始化
    setTimeout(() => {
      window.location.reload()
    }, 1500)
  } catch (e) {
    message.value = '导入失败: ' + (e as Error).message
    messageType.value = 'error'
  } finally {
    importing.value = false
  }
}
```

**Step 3: 修复预览统计文案 "条数据" → "个文件"**

```html
<span>共 {{ Object.keys(previewData.data).length }} 个文件</span>
```

---

### Task 4: 验证修复

**Step 1: TypeScript 类型检查**

```bash
npx tsc --noEmit
```

Expected: 无类型错误

**Step 2: 提交**

```bash
git add src/services/local-storage.ts src/services/backup.ts src/components/settings/BackupRestore.vue
git commit -m "fix: resolve backup/restore critical and important issues"
```

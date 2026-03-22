import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ThinkingArchiveEntry } from '@/types'
import { storage } from '@/services/storage-factory'

function archivePath(weekId: string) {
  return `weeks/${weekId}/thinking-archive.json`
}

export const useThinkingArchiveStore = defineStore('thinking-archive', () => {
  const entries = ref<ThinkingArchiveEntry[]>([])
  const loading = ref(false)

  async function loadWeek(weekId: string) {
    loading.value = true
    try {
      const data = await storage.read<ThinkingArchiveEntry[]>(archivePath(weekId))
      if (data) {
        const existingIds = new Set(entries.value.map(e => e.id))
        for (const entry of data) {
          if (!existingIds.has(entry.id)) entries.value.push(entry)
        }
      }
    } finally {
      loading.value = false
    }
  }

  async function addEntry(weekId: string, entry: ThinkingArchiveEntry) {
    const current = await storage.read<ThinkingArchiveEntry[]>(archivePath(weekId)) ?? []
    const filtered = current.filter(e => e.id !== entry.id)
    filtered.push(entry)
    await storage.write(archivePath(weekId), filtered)

    const idx = entries.value.findIndex(e => e.id === entry.id)
    if (idx >= 0) entries.value[idx] = entry
    else entries.value.push(entry)
  }

  async function loadAll(weekIds: string[]) {
    entries.value = []
    loading.value = true
    try {
      for (const weekId of weekIds) {
        const data = await storage.read<ThinkingArchiveEntry[]>(archivePath(weekId))
        if (data) entries.value.push(...data)
      }
    } finally {
      loading.value = false
    }
  }

  return { entries, loading, loadWeek, addEntry, loadAll }
})

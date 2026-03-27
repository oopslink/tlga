import { defineStore, setActivePinia } from 'pinia'
import { ref } from 'vue'
import { pinia } from './pinia-instance'
import type { PlayerState } from '@/types/tasks'
import { storage } from '@/services/storage-factory'

const _usePlayerStore = defineStore('player', () => {
  const player = ref<PlayerState | null>(null)
  const loading = ref(false)

  async function load() {
    loading.value = true
    try {
      const data = await storage.read<PlayerState>('player.json')
      player.value = data ?? {
        name: '小学霸',
        gold: 0,
        xp: 0,
        createdAt: new Date().toISOString().split('T')[0],
      }
    } finally {
      loading.value = false
    }
  }

  async function save() {
    if (!player.value) return
    await storage.write('player.json', player.value)
  }

  function addRewards(gold: number, xp: number) {
    if (!player.value) return
    player.value.gold += gold
    player.value.xp += xp
  }

  return { player, loading, load, save, addRewards }
})

export function usePlayerStore() {
  setActivePinia(pinia)
  return _usePlayerStore()
}

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DailyLog, HomeworkTask, MathTask, JugglingTask, LanguageTask, RandomDrop } from '@/types'
import type { StorageService } from '@/services/storage'
import { JsonFileStorage } from '@/services/json-file-storage'
import { calcDailyRewards } from '@/engine/daily-aggregator'
import { usePlayerStore } from './player.store'
import { today, getISOWeek, getPreviousDates, getWeekDates } from '@/utils/date'

const storage: StorageService = new JsonFileStorage()

export const useDailyLogStore = defineStore('daily-log', () => {
  const currentLog = ref<DailyLog | null>(null)
  const currentDate = ref(today())
  const loading = ref(false)
  const error = ref<string | null>(null)

  const playerStore = usePlayerStore()

  const isEmpty = computed(() => {
    if (!currentLog.value) return true
    const log = currentLog.value
    return !log.homework.completed && !log.math.completed &&
           !log.juggling.completed && log.languages.length === 0 &&
           log.randomDrops.length === 0
  })

  async function loadDate(date: string) {
    loading.value = true
    error.value = null
    currentDate.value = date

    try {
      const weekId = getISOWeek(new Date(date + 'T00:00:00'))
      const path = `weeks/${weekId}/daily-logs/${date}.json`
      const data = await storage.read<DailyLog>(path)

      if (data) {
        currentLog.value = data
      } else {
        // Create new empty log
        currentLog.value = createEmptyLog(date)
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load daily log'
    } finally {
      loading.value = false
    }
  }

  async function loadToday() {
    await loadDate(today())
  }

  function createEmptyLog(date: string): DailyLog {
    return {
      date,
      homework: { completed: false, quality: 'ok', selfChecked: false },
      math: { completed: false, difficulty: 'basic', problems: 0, allCorrect: false },
      juggling: { completed: false, minutes: 0, newRecord: false },
      languages: [],
      randomDrops: [],
      rewards: {
        baseGold: 0, levelBonusGold: 0, mathMultipliedGold: 0, streakGold: 0, totalGold: 0,
        baseXp: 0, totalXp: 0, baseStars: 0, levelBonusStars: 0, totalStars: 0, breakdown: [],
      },
      mathMultiplier: 1.0,
      streakDay: 0,
    }
  }

  async function recalculate() {
    if (!currentLog.value || !playerStore.player) return

    const weekId = getISOWeek(new Date(currentDate.value + 'T00:00:00'))
    const weekDates = getWeekDates(weekId).filter(d => d !== currentDate.value)

    // Load previous logs for streak calculation
    const prevDates = getPreviousDates(currentDate.value, 30)
    const previousLogs: DailyLog[] = []
    for (const d of prevDates) {
      const wk = getISOWeek(new Date(d + 'T00:00:00'))
      const p = `weeks/${wk}/daily-logs/${d}.json`
      const log = await storage.read<DailyLog>(p)
      if (log) previousLogs.push(log)
    }

    // Load week logs
    const weekLogs: DailyLog[] = []
    for (const d of weekDates) {
      const p = `weeks/${weekId}/daily-logs/${d}.json`
      const log = await storage.read<DailyLog>(p)
      if (log) weekLogs.push(log)
    }

    const result = calcDailyRewards({
      log: currentLog.value,
      player: playerStore.player,
      previousLogs,
      weekLogs,
    })

    currentLog.value.rewards = result.rewards
    currentLog.value.mathMultiplier = result.mathMultiplier
    currentLog.value.streakDay = result.streakDay
  }

  async function save() {
    if (!currentLog.value) return

    await recalculate()

    try {
      const weekId = getISOWeek(new Date(currentDate.value + 'T00:00:00'))
      const path = `weeks/${weekId}/daily-logs/${currentDate.value}.json`
      await storage.write(path, currentLog.value)

      // Update player
      if (playerStore.player && currentLog.value.rewards.totalGold > 0) {
        const dreamFund = currentLog.value.rewards.breakdown.find(b => b.note?.includes('梦想基金'))?.gold || 0
        playerStore.addRewards({
          gold: currentLog.value.rewards.totalGold,
          xp: currentLog.value.rewards.totalXp,
          stars: currentLog.value.rewards.totalStars,
        }, dreamFund)
        playerStore.updateStreak(currentLog.value.streakDay, currentDate.value)
        await playerStore.save()
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to save daily log'
      throw e
    }
  }

  function updateHomework(task: Partial<HomeworkTask>) {
    if (!currentLog.value) return
    currentLog.value.homework = { ...currentLog.value.homework, ...task }
  }

  function updateMath(task: Partial<MathTask>) {
    if (!currentLog.value) return
    currentLog.value.math = { ...currentLog.value.math, ...task }
  }

  function updateJuggling(task: Partial<JugglingTask>) {
    if (!currentLog.value) return
    currentLog.value.juggling = { ...currentLog.value.juggling, ...task }
  }

  function addLanguage(lang: LanguageTask) {
    if (!currentLog.value) return
    currentLog.value.languages.push(lang)
  }

  function removeLanguage(index: number) {
    if (!currentLog.value) return
    currentLog.value.languages.splice(index, 1)
  }

  function addRandomDrop(drop: RandomDrop) {
    if (!currentLog.value) return
    currentLog.value.randomDrops.push(drop)
  }

  function removeRandomDrop(index: number) {
    if (!currentLog.value) return
    currentLog.value.randomDrops.splice(index, 1)
  }

  return {
    currentLog,
    currentDate,
    loading,
    error,
    isEmpty,
    loadDate,
    loadToday,
    save,
    recalculate,
    updateHomework,
    updateMath,
    updateJuggling,
    addLanguage,
    removeLanguage,
    addRandomDrop,
    removeRandomDrop,
  }
})

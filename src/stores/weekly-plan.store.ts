import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { WeeklyPlan, DailyGoal } from '@/types/tasks'
import { storage } from '@/services/storage-factory'
import {
  createWeeklyPlan,
  addTaskToDay,
  removeTaskFromDay,
  updateTaskCompletion,
  calculateDailyReward,
  calculateWeeklyReward,
} from '@/engine/weekly-plan'
import { currentWeek } from '@/utils/date'

export const useWeeklyPlanStore = defineStore('weekly-plan', () => {
  const currentPlan = ref<WeeklyPlan | null>(null)
  const currentWeekId = ref(currentWeek())
  const loading = ref(false)
  const error = ref<string | null>(null)

  const weekSummary = computed(() => {
    if (!currentPlan.value) return null
    return calculateWeeklyReward(currentPlan.value)
  })

  async function loadWeek(weekId: string) {
    loading.value = true
    error.value = null
    currentWeekId.value = weekId

    try {
      const path = `weeks/${weekId}/plan.json`
      const data = await storage.read<WeeklyPlan>(path)

      if (data) {
        currentPlan.value = data
      } else {
        // 创建新计划
        currentPlan.value = createWeeklyPlan(weekId)
        await save()
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load weekly plan'
    } finally {
      loading.value = false
    }
  }

  async function loadCurrentWeek() {
    await loadWeek(currentWeek())
  }

  async function save() {
    if (!currentPlan.value) return

    try {
      const path = `weeks/${currentPlan.value.weekId}/plan.json`
      await storage.write(path, currentPlan.value)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to save weekly plan'
      throw e
    }
  }

  function addTask(date: string, taskId: string, targetVariant?: string) {
    if (!currentPlan.value) return
    currentPlan.value = addTaskToDay(currentPlan.value, date, taskId, targetVariant)
  }

  function removeTask(date: string, taskIndex: number) {
    if (!currentPlan.value) return
    currentPlan.value = removeTaskFromDay(currentPlan.value, date, taskIndex)
  }

  function updateTask(date: string, taskIndex: number, completed: boolean, achievedVariant?: string, note?: string) {
    if (!currentPlan.value) return
    currentPlan.value = updateTaskCompletion(currentPlan.value, date, taskIndex, completed, achievedVariant, note)
  }

  function getDayGoal(date: string): DailyGoal | undefined {
    return currentPlan.value?.dailyGoals.find(d => d.date === date)
  }

  function getDayReward(date: string) {
    const day = getDayGoal(date)
    if (!day) return null
    return calculateDailyReward(day)
  }

  return {
    currentPlan,
    currentWeekId,
    loading,
    error,
    weekSummary,
    loadWeek,
    loadCurrentWeek,
    save,
    addTask,
    removeTask,
    updateTask,
    getDayGoal,
    getDayReward,
  }
})

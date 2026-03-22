import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { WeeklyPlan, PlannedTaskItem } from '@/types/tasks'
import { storage } from '@/services/storage-factory'
import {
  createWeeklyPlan,
  generatePlanFromWeeklyTemplate,
  activatePlan,
  generateAllProgressSheets,
} from '@/engine/weekly-plan'
import { currentWeek, getWeekDates } from '@/utils/date'
import { useProgressStore } from './progress.store'
import { useWeeklyTemplateStore } from './weekly-template.store'
import { useModal } from '@/composables/useModal'

export const usePlanStore = defineStore('plan', () => {
  const plan = ref<WeeklyPlan | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const weekId = computed(() => plan.value?.weekId ?? '')
  const isActive = computed(() => plan.value?.status === 'active')
  const isDraft = computed(() => plan.value?.status === 'draft')

  async function loadWeek(wk: string) {
    loading.value = true
    error.value = null
    try {
      const data = await storage.read<WeeklyPlan>(`weeks/${wk}/plan.json`)
      const expectedDates = getWeekDates(wk)
      const storedDates = data?.dailyPlans.map(d => d.date) ?? []
      const datesMatch = expectedDates.every((d, i) => d === storedDates[i])

      if (data && datesMatch) {
        plan.value = data
      } else {
        // 无计划，或已存计划的日期与当前周起始设置不符（如从周一改为周日），重新生成
        const templateStore = useWeeklyTemplateStore()
        await templateStore.load()
        plan.value = generatePlanFromWeeklyTemplate(wk, templateStore.defaultTemplate)
      }
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function loadCurrentWeek() {
    await loadWeek(currentWeek())
  }

  async function save() {
    if (!plan.value) return
    await storage.write(`weeks/${plan.value.weekId}/plan.json`, plan.value)
  }

  function addTask(date: string, taskId: string, note: string, targetVariant?: string) {
    if (!plan.value) return
    const dp = plan.value.dailyPlans.find(d => d.date === date)
    if (!dp) return
    dp.tasks.push({ taskId, targetVariant, note })
    plan.value.updatedAt = new Date().toISOString()
  }

  async function removeTask(date: string, idx: number) {
    if (!plan.value) return
    const dp = plan.value.dailyPlans.find(d => d.date === date)
    if (!dp) return
    const task = dp.tasks[idx]
    if (task?.isLocked) {
      const { showAlert } = useModal()
      await showAlert('此项来自周模板，不可删除。\n如需修改，请前往"模板管理"调整模板。')
      return
    }
    dp.tasks.splice(idx, 1)
    plan.value.updatedAt = new Date().toISOString()
  }

  function editTask(date: string, idx: number, changes: Partial<PlannedTaskItem>) {
    if (!plan.value) return
    const dp = plan.value.dailyPlans.find(d => d.date === date)
    if (!dp || !dp.tasks[idx]) return
    Object.assign(dp.tasks[idx], changes)
    plan.value.updatedAt = new Date().toISOString()
  }

  /** 激活周计划，同时生成所有进度单 */
  async function activate() {
    if (!plan.value) return
    plan.value = activatePlan(plan.value)
    await save()

    // 生成进度单
    const progressStore = useProgressStore()
    const sheets = generateAllProgressSheets(plan.value)
    for (const sheet of sheets) {
      // 如果当天有任务才写入
      if (sheet.tasks.length > 0) {
        await progressStore.saveSheet(sheet)
      }
    }
  }

  /** 修改已激活的计划：保存并重新生成全部进度单（清空原有进度和审批） */
  async function reactivate() {
    if (!plan.value) return
    plan.value.updatedAt = new Date().toISOString()
    await save()

    // 用新计划重新生成所有进度单（覆盖旧的）
    const progressStore = useProgressStore()
    const sheets = generateAllProgressSheets(plan.value)
    for (const sheet of sheets) {
      await progressStore.saveSheet(sheet)
    }
  }

  async function deletePlan() {
    if (!plan.value) return
    const wk = plan.value.weekId
    plan.value = createWeeklyPlan(wk)
    await save()
  }

  return { plan, loading, error, weekId, isActive, isDraft, loadWeek, loadCurrentWeek, save, addTask, removeTask, editTask, activate, reactivate, deletePlan }
})

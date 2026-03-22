import type { WeeklyPlan, DailyPlan, PlannedTaskItem, DailyProgressSheet, ProgressTaskItem, WeeklyTemplate, WeekdayKey } from '@/types/tasks'
import { getWeekDates, toISODate } from '@/utils/date'

const ISO_WEEKDAY_KEYS: WeekdayKey[] = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
]

// ==================== 周计划管理 ====================

/** 从周模板生成带锁定项的周计划草稿 */
export function generatePlanFromWeeklyTemplate(weekId: string, template: WeeklyTemplate): WeeklyPlan {
  const dates = getWeekDates(weekId)
  const dailyPlans: DailyPlan[] = dates.map((date, idx) => {
    const dayKey = ISO_WEEKDAY_KEYS[idx]
    const dayConfig = template.days[dayKey]
    const tasks: PlannedTaskItem[] = []

    for (const item of dayConfig.mathItems) {
      tasks.push({
        taskId: item.taskId ?? 'homework',
        note: item.label,
        isLocked: true,
        templateItemId: item.id,
      })
    }

    for (const item of dayConfig.languageItems) {
      tasks.push({
        taskId: item.taskId ?? 'recitation',
        note: item.label,
        isLocked: true,
        templateItemId: item.id,
      })
    }

    return { date, tasks }
  })

  return {
    weekId,
    startDate: dates[0],
    endDate: dates[6],
    status: 'draft',
    dailyPlans,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export function createWeeklyPlan(weekId: string): WeeklyPlan {
  const dates = getWeekDates(weekId)
  return {
    weekId,
    startDate: dates[0],
    endDate: dates[6],
    status: 'draft',
    dailyPlans: dates.map(date => ({ date, tasks: [] })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export function addTaskToPlan(
  plan: WeeklyPlan,
  date: string,
  taskId: string,
  note: string,
  targetVariant?: string,
): WeeklyPlan {
  const dayIdx = plan.dailyPlans.findIndex(d => d.date === date)
  if (dayIdx === -1) return plan

  const updated = structuredClone(plan)
  updated.dailyPlans[dayIdx].tasks.push({ taskId, targetVariant, note })
  updated.updatedAt = new Date().toISOString()
  return updated
}

export function removeTaskFromPlan(plan: WeeklyPlan, date: string, taskIndex: number): WeeklyPlan {
  const dayIdx = plan.dailyPlans.findIndex(d => d.date === date)
  if (dayIdx === -1) return plan

  const updated = structuredClone(plan)
  updated.dailyPlans[dayIdx].tasks.splice(taskIndex, 1)
  updated.updatedAt = new Date().toISOString()
  return updated
}

export function updatePlanTask(
  plan: WeeklyPlan,
  date: string,
  taskIndex: number,
  changes: Partial<PlannedTaskItem>,
): WeeklyPlan {
  const dayIdx = plan.dailyPlans.findIndex(d => d.date === date)
  if (dayIdx === -1) return plan

  const updated = structuredClone(plan)
  const task = updated.dailyPlans[dayIdx].tasks[taskIndex]
  if (!task) return plan
  Object.assign(task, changes)
  updated.updatedAt = new Date().toISOString()
  return updated
}

export function activatePlan(plan: WeeklyPlan): WeeklyPlan {
  return { ...plan, status: 'active', updatedAt: new Date().toISOString() }
}

// ==================== 从周计划生成每日进度单 ====================

export function generateProgressSheet(dailyPlan: DailyPlan, weekId: string): DailyProgressSheet {
  return {
    date: dailyPlan.date,
    weekId,
    status: 'pending',
    tasks: dailyPlan.tasks.map(t => ({
      taskId: t.taskId,
      targetVariant: t.targetVariant,
      note: t.note,
      completed: false,
      finalGold: 0,
      finalXp: 0,
    })),
    settled: false,
    totalGold: 0,
    totalXp: 0,
  }
}

export function generateAllProgressSheets(plan: WeeklyPlan): DailyProgressSheet[] {
  return plan.dailyPlans.map(dp => generateProgressSheet(dp, plan.weekId))
}

// ==================== 检查今日进度单是否存在 ====================

export function getTodayDate(): string {
  return toISODate(new Date())
}

export function needsProgressSheet(plan: WeeklyPlan, date: string, existingSheets: DailyProgressSheet[]): boolean {
  if (plan.status !== 'active') return false
  const dayPlan = plan.dailyPlans.find(d => d.date === date)
  if (!dayPlan || dayPlan.tasks.length === 0) return false
  return !existingSheets.some(s => s.date === date)
}

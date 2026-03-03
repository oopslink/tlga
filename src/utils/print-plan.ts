import type { WeeklyPlan, PlannedTaskItem } from '@/types/tasks'
import { TASK_DEFINITIONS } from '@/types/tasks'

export interface PrintRow {
  taskId: string
  label: string
  cells: string[]     // 7 cells, one per day
  isLocked: boolean
}

export interface PrintData {
  rows: PrintRow[]
  dailyGold: number[]
}

function getTaskGold(taskId: string, targetVariant?: string): number {
  const task = TASK_DEFINITIONS.find(t => t.id === taskId)
  if (!task) return 0
  if (targetVariant && task.variants) {
    const v = task.variants.find(v => v.level === targetVariant)
    if (v) return v.gold
  }
  return task.gold
}

function getTaskName(taskId: string): string {
  return TASK_DEFINITIONS.find(t => t.id === taskId)?.name ?? taskId
}

function cellContent(item: PlannedTaskItem): string {
  if (item.isLocked) {
    return item.targetVariant || '✓'
  }
  if (item.note) return item.note
  if (item.targetVariant) return item.targetVariant
  return '✓'
}

export function buildPrintRows(plan: WeeklyPlan): PrintData {
  const keyToIndex = new Map<string, number>()
  const rows: PrintRow[] = []
  const dailyGold: number[] = Array(7).fill(0)

  plan.dailyPlans.forEach((dp, dayIdx) => {
    dp.tasks.forEach(item => {
      const key = item.isLocked ? `locked:${item.note}` : `task:${item.taskId}`

      if (!keyToIndex.has(key)) {
        const label = item.isLocked ? item.note : getTaskName(item.taskId)
        keyToIndex.set(key, rows.length)
        rows.push({
          taskId: item.isLocked ? '' : item.taskId,
          label,
          cells: Array(7).fill(''),
          isLocked: !!item.isLocked,
        })
      }

      const row = rows[keyToIndex.get(key)!]
      row.cells[dayIdx] = cellContent(item)

      if (!item.isLocked && item.taskId) {
        dailyGold[dayIdx] += getTaskGold(item.taskId, item.targetVariant)
      }
    })
  })

  return { rows, dailyGold }
}

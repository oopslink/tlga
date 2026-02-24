import type { DailyProgressSheet } from '@/types/tasks'
import { TASK_DEFINITIONS } from '@/types/tasks'

export const ALL_ANCHORS_BONUS_GOLD = 2
export const ALL_ANCHORS_BONUS_XP = 10

/**
 * 检测三锚点是否全部完成：
 * 锚点一：数学类任务至少有一项完成
 * 锚点二：语言类任务至少有一项完成
 * 锚点三：反思内容已填写（reflection 非空）
 */
export function checkAllAnchorsCompleted(sheet: DailyProgressSheet): boolean {
  const taskDefs = new Map(TASK_DEFINITIONS.map(t => [t.id, t]))

  const hasMath = sheet.tasks.some(t => {
    const def = taskDefs.get(t.taskId)
    return def?.category === 'academic' && t.completed
  })

  const hasLanguage = sheet.tasks.some(t => {
    const def = taskDefs.get(t.taskId)
    return def?.category === 'language' && t.completed
  })

  const hasReflection = !!(sheet.reflection?.content?.trim())

  return hasMath && hasLanguage && hasReflection
}

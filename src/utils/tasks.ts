import type { TaskCategory, TaskDefinition } from '@/types/tasks'
import { TASK_DEFINITIONS } from '@/types/tasks'
import { useTaskDefinitionsStore } from '@/stores/task-definitions.store'

/**
 * 获取所有任务（内置 + 自定义）
 */
export function getAllTaskDefinitions(): TaskDefinition[] {
  const taskStore = useTaskDefinitionsStore()
  return [...TASK_DEFINITIONS, ...taskStore.customTasks]
}

/**
 * 根据类别获取任务
 */
export function getTasksByCategory(category: TaskCategory): TaskDefinition[] {
  return getAllTaskDefinitions().filter(t => t.category === category)
}

/**
 * 根据 ID 获取任务
 */
export function getTaskById(id: string): TaskDefinition | undefined {
  return getAllTaskDefinitions().find(t => t.id === id)
}

/**
 * 获取任务奖励
 */
export function getTaskReward(taskId: string, variant?: string): { gold: number; xp: number } {
  const task = getTaskById(taskId)
  if (!task) return { gold: 0, xp: 0 }
  if (variant && task.variants) {
    const v = task.variants.find(v => v.level === variant)
    if (v) return { gold: v.gold, xp: v.xp }
  }
  return { gold: task.gold, xp: task.xp }
}

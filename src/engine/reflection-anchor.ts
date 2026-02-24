import type { ReflectionType, MethodLog } from '@/types/tasks'

export const REFLECTION_GOLD: Record<ReflectionType, number> = {
  discovery: 3,
  'open-question': 2,
  'method-log': 3,
}

export function calcReflectionGold(type: ReflectionType): number {
  return REFLECTION_GOLD[type]
}

export function validateMethodLog(log: MethodLog): boolean {
  return log.problem.trim() !== '' && log.method.trim() !== '' && log.principle.trim() !== ''
}

export const REFLECTION_TYPE_LABELS: Record<ReflectionType, string> = {
  discovery: '发现时刻',
  'open-question': '开放问题',
  'method-log': '方法日志',
}

export const REFLECTION_TYPE_ICONS: Record<ReflectionType, string> = {
  discovery: '💡',
  'open-question': '❓',
  'method-log': '📝',
}

import type { WeeklyTemplate } from '@/types/tasks'

// 工作日框架（周一至周五）
const WEEKDAY_CONFIG = {
  mathItems: [
    { id: 'anchor-math-homework', label: '学校数学作业（含课堂配套练习）', taskId: 'homework' },
    { id: 'anchor-math-hard', label: '1道难题（钻石/王者模式）', taskId: 'math-hard' },
  ],
  languageItems: [
    { id: 'anchor-lang-recitation', label: '背诵', taskId: 'recitation' },
    { id: 'anchor-lang-chinese', label: '中文阅读' },
    { id: 'anchor-lang-en-or-fr', label: '英语/法语阅读（选一，可两项都做）' },
  ],
  reflectionEnabled: true,
}

// 周末框架（周六至周日，无学校作业，保留核心项）
const WEEKEND_CONFIG = {
  mathItems: [
    { id: 'anchor-math-hard', label: '1道难题（钻石/王者模式）', taskId: 'math-hard' },
  ],
  languageItems: [
    { id: 'anchor-lang-chinese', label: '中文阅读' },
    { id: 'anchor-lang-en-or-fr', label: '英语/法语阅读（选一，可两项都做）' },
  ],
  reflectionEnabled: true,
}

export const DEFAULT_WEEKLY_TEMPLATE: WeeklyTemplate = {
  id: 'default',
  name: '标准学期模板',
  isDefault: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  days: {
    monday:    WEEKDAY_CONFIG,
    tuesday:   WEEKDAY_CONFIG,
    wednesday: WEEKDAY_CONFIG,
    thursday:  WEEKDAY_CONFIG,
    friday:    WEEKDAY_CONFIG,
    saturday:  WEEKEND_CONFIG,
    sunday:    WEEKEND_CONFIG,
  },
}

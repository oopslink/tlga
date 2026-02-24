// ==================== 任务定义 ====================

export type TaskCategory = 'academic' | 'sports' | 'language' | 'art' | 'behavior'

export interface TaskDefinition {
  id: string
  category: TaskCategory
  name: string
  description: string
  gold: number
  xp: number
  variants?: TaskVariant[]
}

export interface TaskVariant {
  level: string
  gold: number
  xp: number
}

// ==================== 周计划（小学霸创建） ====================

export type WeeklyPlanStatus = 'draft' | 'active' | 'completed'

export interface WeeklyPlan {
  weekId: string                // "2026-W07"
  startDate: string
  endDate: string
  status: WeeklyPlanStatus
  dailyPlans: DailyPlan[]       // 7 天
  createdAt: string
  updatedAt: string
}

export interface DailyPlan {
  date: string                  // "2026-02-10"
  tasks: PlannedTaskItem[]
}

export interface PlannedTaskItem {
  taskId: string
  targetVariant?: string        // 目标完成程度
  note: string                  // 说明文本/备注
}

// ==================== 反思类型 ====================

export type ReflectionType = 'discovery' | 'open-question' | 'method-log'

export interface MethodLog {
  problem: string
  method: string
  principle: string
}

// ==================== 每日进度单（系统生成，小学霸填写） ====================

export type ProgressSheetStatus = 'pending' | 'submitted' | 'approved' | 'rejected'

export interface DailyProgressSheet {
  date: string
  weekId: string
  status: ProgressSheetStatus
  tasks: ProgressTaskItem[]
  submittedAt?: string
  reviewedAt?: string
  reviewComment?: string        // 审批员整体评语
  // 锚点三：反思与创造
  reflection?: {
    type: ReflectionType
    content: string
    methodLog?: MethodLog
    goldEarned: number          // 2 或 3
  }
  allAnchorsCompleted?: boolean
  allAnchorsBonusGold?: number  // +2
  allAnchorsBonusXp?: number    // +10
  // 周日回顾
  weeklyReview?: {
    completed: boolean
    answers: { proudest: string; discovery: string; nextWeek: string }
    goldEarned: number          // 5
  }
  // 额外加成（审批员设置）
  bonusMultiplier?: number      // 整体倍率（如 1.5 表示 ×1.5）
  bonusGold?: number            // 额外金币
  bonusXp?: number              // 额外经验
  // 结算结果（approved 后自动计算）
  settled: boolean
  totalGold: number
  totalXp: number
}

export interface ProgressTaskItem {
  taskId: string
  targetVariant?: string        // 来自计划
  note: string                  // 来自计划的备注
  // 小学霸填写
  completed: boolean
  achievedVariant?: string      // 实际达成的完成程度
  kidComment?: string           // 小学霸自己的备注
  // 审批员修改
  approverOverrideCompleted?: boolean   // 审批员改判完成/未完成
  approverOverrideVariant?: string      // 审批员修正完成程度
  approverComment?: string              // 审批员对此任务的批注
  // 结算
  finalGold: number
  finalXp: number
}

// ==================== 玩家状态 ====================

export interface PlayerState {
  name: string
  gold: number
  xp: number
  lastSettledDate?: string
  createdAt: string
}

// ==================== 任务目录 ====================

export const TASK_DEFINITIONS: TaskDefinition[] = [
  // 学业类
  {
    id: 'homework',
    category: 'academic',
    name: '学校作业',
    description: '完成当天学校布置的作业',
    gold: 1,
    xp: 0,
  },
  {
    id: 'math-simple',
    category: 'academic',
    name: '奥数简单版',
    description: '基础奥数练习',
    gold: 2,
    xp: 0,
    variants: [
      { level: '基础完成', gold: 2, xp: 0 },
      { level: '正确率80%+', gold: 3, xp: 0 },
      { level: '正确率100%', gold: 4, xp: 0 },
    ],
  },
  {
    id: 'math-challenge',
    category: 'academic',
    name: '数学挑战题',
    description: '数学挑战题（难度低于奥数难版）',
    gold: 2,
    xp: 5,
    variants: [
      { level: '完成1题', gold: 2, xp: 5 },
      { level: '完成2题', gold: 4, xp: 10 },
      { level: '完成3题', gold: 6, xp: 15 },
    ],
  },
  {
    id: 'math-hard',
    category: 'academic',
    name: '奥数难版',
    description: '高难度奥数练习',
    gold: 3,
    xp: 5,
    variants: [
      { level: '基础完成', gold: 3, xp: 5 },
      { level: '正确率80%+', gold: 5, xp: 10 },
      { level: '正确率100%', gold: 7, xp: 15 },
    ],
  },
  // 运动类
  {
    id: 'juggling',
    category: 'sports',
    name: '抛接球挑战',
    description: '连续抛接球',
    gold: 1,
    xp: 0,
    variants: [
      { level: '连续30个', gold: 1, xp: 0 },
      { level: '连续50个', gold: 2, xp: 0 },
      { level: '连续100个', gold: 3, xp: 0 },
    ],
  },
  // 语言学习
  {
    id: 'recitation',
    category: 'language',
    name: '背诵任务',
    description: '完成背诵内容',
    gold: 1,
    xp: 0,
  },
  {
    id: 'french-reading',
    category: 'language',
    name: '法语阅读',
    description: '完成法语阅读（固定4金）',
    gold: 4,
    xp: 0,
  },
  {
    id: 'french-advanced-reading',
    category: 'language',
    name: '法语高阶阅读',
    description: '法语高级难度阅读材料',
    gold: 3,
    xp: 5,
    variants: [
      { level: '完成阅读', gold: 3, xp: 5 },
      { level: '完成阅读+理解练习', gold: 5, xp: 10 },
    ],
  },
  {
    id: 'english-reading',
    category: 'language',
    name: '英语阅读',
    description: '完成阅读',
    gold: 1,
    xp: 0,
  },
  // 艺术类
  {
    id: 'piano',
    category: 'art',
    name: '钢琴练习',
    description: '钢琴练习',
    gold: 1,
    xp: 0,
    variants: [
      { level: '练习20分钟', gold: 1, xp: 0 },
      { level: '练习30分钟', gold: 2, xp: 0 },
    ],
  },
  {
    id: 'handwriting',
    category: 'art',
    name: '写字练习',
    description: '写字练习',
    gold: 1,
    xp: 0,
    variants: [
      { level: '练习20分钟', gold: 1, xp: 0 },
      { level: '练习40分钟', gold: 2, xp: 0 },
    ],
  },
  // 行为习惯
  {
    id: 'polite',
    category: 'behavior',
    name: '有礼貌',
    description: '有礼貌',
    gold: 2,
    xp: 0,
  },
  {
    id: 'conflict-resolution',
    category: 'behavior',
    name: '处理矛盾',
    description: '处理矛盾',
    gold: 3,
    xp: 15,
  },
]

// ==================== 语言组合奖励 ====================

export const LANGUAGE_COMBO_REWARDS = [
  { count: 2, gold: 2, xp: 0, label: '完成2项语言学习' },
  { count: 3, gold: 3, xp: 0, label: '完成3项语言学习' },
]

// ==================== 每日模版 ====================

export interface DailyTemplate {
  id: string
  name: string
  description: string
  tasks: PlannedTaskItem[]
  createdAt: string
}

// ==================== 工具函数 ====================

export function getTasksByCategory(category: TaskCategory): TaskDefinition[] {
  return TASK_DEFINITIONS.filter(t => t.category === category)
}

export function getTaskById(id: string): TaskDefinition | undefined {
  return TASK_DEFINITIONS.find(t => t.id === id)
}

export function getTaskReward(taskId: string, variant?: string): { gold: number; xp: number } {
  const task = getTaskById(taskId)
  if (!task) return { gold: 0, xp: 0 }
  if (variant && task.variants) {
    const v = task.variants.find(v => v.level === variant)
    if (v) return { gold: v.gold, xp: v.xp }
  }
  return { gold: task.gold, xp: task.xp }
}

export const CATEGORY_NAMES: Record<TaskCategory, string> = {
  academic: '学业类',
  sports: '运动类',
  language: '语言学习',
  art: '艺术类',
  behavior: '行为习惯',
}

export const CATEGORY_ICONS: Record<TaskCategory, string> = {
  academic: '📚',
  sports: '🏃',
  language: '🌍',
  art: '🎨',
  behavior: '🌟',
}

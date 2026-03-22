import type { DailyProgressSheet, ProgressTaskItem } from '@/types/tasks'
import { getTaskById, getTaskReward, LANGUAGE_COMBO_REWARDS } from '@/types/tasks'

/**
 * 审批通过后，计算每日进度单的最终积分。
 *
 * 规则：
 * 1. 每个任务的完成状态以审批员为准（有override就用override，否则用小学霸填写的）
 * 2. 每个任务的完成程度以审批员修正为准
 * 3. 语言学习组合奖励自动计算
 * 4. 应用额外加成：倍率 → 额外金币/XP
 */
export function settleProgressSheet(sheet: DailyProgressSheet): DailyProgressSheet {
  const settled = structuredClone(sheet)
  let totalGold = 0
  let totalXp = 0

  // 计算每个任务的最终奖励
  for (const task of settled.tasks) {
    const isCompleted = task.approverOverrideCompleted !== undefined
      ? task.approverOverrideCompleted
      : task.completed

    if (!isCompleted) {
      task.finalGold = 0
      task.finalXp = 0
      continue
    }

    const finalVariant = task.approverOverrideVariant || task.achievedVariant || task.targetVariant
    const reward = getTaskReward(task.taskId, finalVariant)
    task.finalGold = reward.gold
    task.finalXp = reward.xp
    totalGold += reward.gold
    totalXp += reward.xp
  }

  // 语言学习组合奖励
  const combo = calcLanguageCombo(settled.tasks)
  totalGold += combo.gold
  totalXp += combo.xp

  // 应用额外加成
  const multiplier = settled.bonusMultiplier ?? 1
  if (multiplier !== 1) {
    totalGold = Math.floor(totalGold * multiplier)
    totalXp = Math.floor(totalXp * multiplier)
  }
  totalGold += settled.bonusGold ?? 0
  totalXp += settled.bonusXp ?? 0

  settled.totalGold = totalGold
  settled.totalXp = totalXp
  settled.settled = true

  return settled
}

/**
 * 计算语言学习组合奖励
 */
export function calcLanguageCombo(tasks: ProgressTaskItem[]): { gold: number; xp: number; label?: string } {
  const completedLanguageTasks = tasks.filter(t => {
    const def = getTaskById(t.taskId)
    if (!def || def.category !== 'language') return false
    const isCompleted = t.approverOverrideCompleted !== undefined
      ? t.approverOverrideCompleted
      : t.completed
    return isCompleted
  })

  const count = completedLanguageTasks.length
  // 取最高档组合奖励（3项优先于2项）
  for (let i = LANGUAGE_COMBO_REWARDS.length - 1; i >= 0; i--) {
    if (count >= LANGUAGE_COMBO_REWARDS[i].count) {
      return LANGUAGE_COMBO_REWARDS[i]
    }
  }

  return { gold: 0, xp: 0 }
}

/**
 * 计算单个任务的预期奖励（用于审批预览）
 */
export function calcTaskReward(taskId: string, isCompleted: boolean, variant?: string): { gold: number; xp: number } {
  if (!isCompleted) return { gold: 0, xp: 0 }
  return getTaskReward(taskId, variant)
}

/**
 * 预览结算结果（不修改原数据）
 */
export function previewSettlement(sheet: DailyProgressSheet): { totalGold: number; totalXp: number; combo: { gold: number; xp: number; label?: string } } {
  const preview = settleProgressSheet(sheet)
  const combo = calcLanguageCombo(preview.tasks)
  return {
    totalGold: preview.totalGold,
    totalXp: preview.totalXp,
    combo,
  }
}

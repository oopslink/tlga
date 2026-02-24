import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DailyProgressSheet, ProgressTaskItem } from '@/types/tasks'
import { storage } from '@/services/storage-factory'
import { usePlayerStore } from './player.store'
import { useThinkingArchiveStore } from './thinking-archive.store'
import { checkAllAnchorsCompleted, ALL_ANCHORS_BONUS_GOLD, ALL_ANCHORS_BONUS_XP } from '@/engine/all-anchors-bonus'
import type { ThinkingArchiveEntry } from '@/types'

function sheetPath(weekId: string, date: string) {
  return `weeks/${weekId}/progress/${date}.json`
}

export const useProgressStore = defineStore('progress', () => {
  const currentSheet = ref<DailyProgressSheet | null>(null)
  const weekSheets = ref<DailyProgressSheet[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ==================== 加载 ====================

  async function loadSheet(weekId: string, date: string) {
    loading.value = true
    error.value = null
    try {
      const data = await storage.read<DailyProgressSheet>(sheetPath(weekId, date))
      currentSheet.value = data
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function loadWeekSheets(weekId: string, dates: string[]) {
    loading.value = true
    const sheets: DailyProgressSheet[] = []
    for (const date of dates) {
      const data = await storage.read<DailyProgressSheet>(sheetPath(weekId, date))
      if (data) sheets.push(data)
    }
    weekSheets.value = sheets
    loading.value = false
  }

  async function saveSheet(sheet: DailyProgressSheet) {
    await storage.write(sheetPath(sheet.weekId, sheet.date), sheet)
  }

  // ==================== 小学霸填写进度 ====================

  function updateTaskProgress(taskIndex: number, completed: boolean, achievedVariant?: string, kidComment?: string) {
    if (!currentSheet.value) return
    const task = currentSheet.value.tasks[taskIndex]
    if (!task) return
    task.completed = completed
    task.achievedVariant = achievedVariant
    task.kidComment = kidComment
  }

  function updateReflections(reflections: DailyProgressSheet['reflections']) {
    if (!currentSheet.value) return
    currentSheet.value.reflections = reflections
  }

  function updateWeeklyReview(review: DailyProgressSheet['weeklyReview']) {
    if (!currentSheet.value) return
    currentSheet.value.weeklyReview = review
  }

  async function submitSheet() {
    if (!currentSheet.value) return
    currentSheet.value.status = 'submitted'
    currentSheet.value.submittedAt = new Date().toISOString()
    await saveSheet(currentSheet.value)
  }

  // ==================== 审批员审批 ====================

  function overrideTask(taskIndex: number, overrideCompleted?: boolean, overrideVariant?: string, comment?: string) {
    if (!currentSheet.value) return
    const task = currentSheet.value.tasks[taskIndex]
    if (!task) return
    if (overrideCompleted !== undefined) task.approverOverrideCompleted = overrideCompleted
    if (overrideVariant !== undefined) task.approverOverrideVariant = overrideVariant
    if (comment !== undefined) task.approverComment = comment
  }

  /** 审批通过：结算积分（审批页面已设置好每项任务的 finalGold/finalXp 和加成字段） */
  async function approveSheet(reviewComment?: string) {
    if (!currentSheet.value) return

    const s = currentSheet.value

    // 汇总各任务积分
    let taskGold = 0
    let taskXp = 0
    for (const task of s.tasks) {
      taskGold += task.finalGold
      taskXp += task.finalXp
    }

    // 应用额外加成
    const multiplier = s.bonusMultiplier ?? 1
    let totalGold = Math.floor(taskGold * multiplier)
    let totalXp = Math.floor(taskXp * multiplier)
    totalGold += s.bonusGold ?? 0
    totalXp += s.bonusXp ?? 0

    // 反思与创造金币（所有填写的项目累加）
    for (const r of s.reflections ?? []) {
      totalGold += r.goldEarned
    }

    // 三锚点全完成奖励
    const allAnchors = checkAllAnchorsCompleted(s)
    s.allAnchorsCompleted = allAnchors
    if (allAnchors) {
      s.allAnchorsBonusGold = ALL_ANCHORS_BONUS_GOLD
      s.allAnchorsBonusXp = ALL_ANCHORS_BONUS_XP
      totalGold += ALL_ANCHORS_BONUS_GOLD
      totalXp += ALL_ANCHORS_BONUS_XP
    }

    // 周日回顾金币
    totalGold += s.weeklyReview?.goldEarned ?? 0

    s.totalGold = totalGold
    s.totalXp = totalXp
    s.settled = true
    s.status = 'approved'
    s.reviewedAt = new Date().toISOString()
    s.reviewComment = reviewComment

    await saveSheet(s)

    // 累加到玩家积分
    const playerStore = usePlayerStore()
    await playerStore.load()
    playerStore.addRewards(totalGold, totalXp)
    await playerStore.save()

    // 写入思维档案（每个填写的反思项各存一条）
    const filled = (s.reflections ?? []).filter(r => r.content?.trim())
    if (filled.length > 0) {
      const archiveStore = useThinkingArchiveStore()
      for (const r of filled) {
        const entry: ThinkingArchiveEntry = {
          id: `${s.date}-${r.type}`,
          date: s.date,
          weekId: s.weekId,
          type: r.type,
          content: r.content,
          methodLog: r.methodLog,
          goldEarned: r.goldEarned,
        }
        await archiveStore.addEntry(s.weekId, entry)
      }
    }
  }

  /** 驳回 */
  async function rejectSheet(reviewComment?: string) {
    if (!currentSheet.value) return
    currentSheet.value.status = 'rejected'
    currentSheet.value.reviewedAt = new Date().toISOString()
    currentSheet.value.reviewComment = reviewComment
    await saveSheet(currentSheet.value)
  }

  return {
    currentSheet, weekSheets, loading, error,
    loadSheet, loadWeekSheets, saveSheet,
    updateTaskProgress, updateReflections, updateWeeklyReview, submitSheet,
    overrideTask, approveSheet, rejectSheet,
  }
})

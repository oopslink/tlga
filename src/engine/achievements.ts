import type { Achievement, DailyLog, Player } from '@/types'
import { ACHIEVEMENT_DEFINITIONS } from './constants'
import { hasLanguageCombo } from './language-bonus'

export interface AchievementCheckContext {
  player: Player
  todayLog: DailyLog
  allLogs: DailyLog[]
  unlockedIds: Set<string>
}

type AchievementChecker = (ctx: AchievementCheckContext) => boolean

const checkers: Record<string, AchievementChecker> = {
  'first-perfect': (ctx) => {
    const log = ctx.todayLog
    return log.homework.completed && log.math.completed &&
           log.juggling.completed && log.languages.some(l => l.completed)
  },

  'math-genius': (ctx) => {
    let total = 0
    for (const log of ctx.allLogs) {
      if (log.math.completed) total += log.math.problems
    }
    if (ctx.todayLog.math.completed) total += ctx.todayLog.math.problems
    return total >= 50
  },

  'streak-7': (ctx) => ctx.todayLog.streakDay >= 7,

  'streak-30': (ctx) => ctx.todayLog.streakDay >= 30,

  'language-master': (ctx) => hasLanguageCombo(ctx.todayLog.languages),

  'french-lover': (ctx) => {
    let count = 0
    for (const log of ctx.allLogs) {
      if (log.languages.some(l => l.type === 'french' && l.completed)) count++
    }
    if (ctx.todayLog.languages.some(l => l.type === 'french' && l.completed)) count++
    return count >= 20
  },

  'dungeon-master': (_ctx) => {
    // Checked separately in dungeon-scoring
    return false
  },

  'gold-hoarder': (ctx) => ctx.player.gold >= 1000,
}

/**
 * Check all achievements and return newly unlocked ones
 */
export function checkAchievements(ctx: AchievementCheckContext): Achievement[] {
  const newlyUnlocked: Achievement[] = []

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    if (ctx.unlockedIds.has(def.id)) continue

    const checker = checkers[def.id]
    if (checker && checker(ctx)) {
      newlyUnlocked.push({
        ...def,
        unlockedAt: ctx.todayLog.date,
      })
    }
  }

  return newlyUnlocked
}

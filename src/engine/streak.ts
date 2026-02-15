import type { DailyLog, RewardBreakdownItem } from '@/types'
import { STREAK_REWARDS } from './constants'
import { xpToLevelUp } from './level'

export interface StreakResult {
  currentStreak: number
  gold: number
  stars: number
  xpBonus: number // for 14-day level-up
  breakdown: RewardBreakdownItem[]
  triggeredRewards: number[] // which day thresholds were triggered
}

/**
 * Calculate streak from logs. Expects previousLogs sorted most recent first.
 * Returns the streak count including today (if today is active).
 */
export function calcStreak(todayCompleted: boolean, previousLogs: DailyLog[]): number {
  if (!todayCompleted) return 0

  let streak = 1 // today counts
  for (const log of previousLogs) {
    const isActive = log.homework.completed || log.math.completed ||
                     log.juggling.completed || log.languages.some(l => l.completed)
    if (isActive) {
      streak++
    } else {
      break
    }
  }
  return streak
}

/**
 * Check if today is "active" (at least one task completed)
 */
export function isDayActive(log: {
  homework: { completed: boolean }
  math: { completed: boolean }
  juggling: { completed: boolean }
  languages: { completed: boolean }[]
}): boolean {
  return log.homework.completed || log.math.completed ||
         log.juggling.completed || log.languages.some(l => l.completed)
}

/**
 * Calculate streak rewards for the current streak day.
 *
 * Rules:
 * - Every multiple of 3: 3-day reward (30 gold + 1 star)
 * - Every multiple of 7: 7-day reward (70 gold + 3 stars)
 * - Every multiple of 14: 14-day reward (level up = XP to fill current level)
 * - Same day can trigger multiple (e.g., day 14 → 7-day + 14-day, day 21 → 3-day + 7-day)
 */
export function calcStreakRewards(streakDay: number, totalXp: number): StreakResult {
  let gold = 0
  let stars = 0
  let xpBonus = 0
  const breakdown: RewardBreakdownItem[] = []
  const triggeredRewards: number[] = []

  for (const reward of STREAK_REWARDS) {
    if (streakDay > 0 && streakDay % reward.days === 0) {
      if (reward.days === 14) {
        // 14-day reward: level up
        xpBonus = xpToLevelUp(totalXp)
        stars += reward.stars
        breakdown.push({
          source: `连击${reward.days}天：升级!`,
          gold: 0,
          xp: xpBonus,
          stars: reward.stars,
          note: reward.special,
        })
      } else {
        gold += reward.gold
        stars += reward.stars
        breakdown.push({
          source: `连击${reward.days}天`,
          gold: reward.gold,
          xp: 0,
          stars: reward.stars,
          note: reward.special,
        })
      }
      triggeredRewards.push(reward.days)
    }
  }

  return {
    currentStreak: streakDay,
    gold,
    stars,
    xpBonus,
    breakdown,
    triggeredRewards,
  }
}

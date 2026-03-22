import type { DailyLog, WeeklySummary, Currency } from '@/types'

/**
 * Calculate weekly summary from daily logs
 */
export function calcWeeklySummary(weekId: string, logs: DailyLog[]): WeeklySummary {
  let totalGold = 0
  let totalXp = 0
  let totalStars = 0
  let daysActive = 0
  let totalMultiplier = 0
  let multiplierDays = 0
  let longestStreak = 0

  for (const log of logs) {
    const isActive = log.homework.completed || log.math.completed ||
                     log.juggling.completed || log.languages.some(l => l.completed)
    if (isActive) daysActive++

    totalGold += log.rewards.totalGold
    totalXp += log.rewards.totalXp
    totalStars += log.rewards.totalStars

    if (log.mathMultiplier > 1.0) {
      totalMultiplier += log.mathMultiplier
      multiplierDays++
    }

    if (log.streakDay > longestStreak) {
      longestStreak = log.streakDay
    }
  }

  return {
    weekId,
    daysActive,
    totalGold,
    totalXp,
    totalStars,
    averageMathMultiplier: multiplierDays > 0 ? totalMultiplier / multiplierDays : 1.0,
    longestStreak,
    achievementsUnlocked: [],
    challengesCompleted: 0,
  }
}

/**
 * Calculate total currency earned in a week
 */
export function calcWeeklyTotal(logs: DailyLog[]): Currency {
  let gold = 0
  let xp = 0
  let stars = 0

  for (const log of logs) {
    gold += log.rewards.totalGold
    xp += log.rewards.totalXp
    stars += log.rewards.totalStars
  }

  return { gold, xp, stars }
}

import type { LanguageTask, DailyLog, RewardBreakdownItem } from '@/types'
import {
  LANGUAGE_COMBO_GOLD, LANGUAGE_COMBO_XP, LANGUAGE_COMBO_STARS,
  FRENCH_STREAK_DAYS, FRENCH_STREAK_GOLD, FRENCH_STREAK_STARS,
  FRENCH_WEEKLY_COUNT, FRENCH_WEEKLY_GOLD, FRENCH_WEEKLY_STARS,
} from './constants'

export interface LanguageBonusResult {
  gold: number
  xp: number
  stars: number
  breakdown: RewardBreakdownItem[]
  hasCombo: boolean
  hasFrenchStreak: boolean
  hasFrenchWeekly: boolean
}

/**
 * Check if all 3 language types are completed today
 */
export function hasLanguageCombo(languages: LanguageTask[]): boolean {
  const types = new Set(languages.filter(l => l.completed).map(l => l.type))
  return types.has('english-reading') && types.has('english-words') && types.has('french')
}

/**
 * Check if French was done for N consecutive days (including today)
 */
export function hasFrenchStreak(todayLangs: LanguageTask[], previousLogs: DailyLog[]): boolean {
  const todayHasFrench = todayLangs.some(l => l.type === 'french' && l.completed)
  if (!todayHasFrench) return false

  let consecutiveDays = 1 // today counts
  for (const log of previousLogs) {
    const hadFrench = log.languages.some(l => l.type === 'french' && l.completed)
    if (hadFrench) {
      consecutiveDays++
    } else {
      break
    }
  }

  return consecutiveDays >= FRENCH_STREAK_DAYS
}

/**
 * Count French sessions in the current week's logs (including today)
 */
export function countFrenchInWeek(todayLangs: LanguageTask[], weekLogs: DailyLog[]): number {
  let count = 0
  if (todayLangs.some(l => l.type === 'french' && l.completed)) {
    count++
  }
  for (const log of weekLogs) {
    if (log.languages.some(l => l.type === 'french' && l.completed)) {
      count++
    }
  }
  return count
}

/**
 * Calculate all language bonuses for today
 * @param todayLangs - today's language tasks
 * @param previousLogs - previous days' logs sorted from most recent to oldest
 * @param weekLogs - other logs in the same week (excluding today)
 */
export function calcLanguageBonus(
  todayLangs: LanguageTask[],
  previousLogs: DailyLog[],
  weekLogs: DailyLog[],
): LanguageBonusResult {
  let gold = 0
  let xp = 0
  let stars = 0
  const breakdown: RewardBreakdownItem[] = []

  const combo = hasLanguageCombo(todayLangs)
  if (combo) {
    gold += LANGUAGE_COMBO_GOLD
    xp += LANGUAGE_COMBO_XP
    stars += LANGUAGE_COMBO_STARS
    breakdown.push({
      source: '语言三连击',
      gold: LANGUAGE_COMBO_GOLD,
      xp: LANGUAGE_COMBO_XP,
      stars: LANGUAGE_COMBO_STARS,
      note: '英语阅读+英语单词+法语',
    })
  }

  const frenchStreak = hasFrenchStreak(todayLangs, previousLogs)
  if (frenchStreak) {
    gold += FRENCH_STREAK_GOLD
    stars += FRENCH_STREAK_STARS
    breakdown.push({
      source: `法语连续${FRENCH_STREAK_DAYS}天`,
      gold: FRENCH_STREAK_GOLD,
      xp: 0,
      stars: FRENCH_STREAK_STARS,
    })
  }

  const frenchCount = countFrenchInWeek(todayLangs, weekLogs)
  const frenchWeekly = frenchCount >= FRENCH_WEEKLY_COUNT
  if (frenchWeekly) {
    // Only give bonus when exactly reaching the threshold (on the 5th time)
    const prevCount = countFrenchInWeek([], weekLogs)
    const todayHasFrench = todayLangs.some(l => l.type === 'french' && l.completed)
    if (todayHasFrench && prevCount === FRENCH_WEEKLY_COUNT - 1) {
      gold += FRENCH_WEEKLY_GOLD
      stars += FRENCH_WEEKLY_STARS
      breakdown.push({
        source: `法语周${FRENCH_WEEKLY_COUNT}次`,
        gold: FRENCH_WEEKLY_GOLD,
        xp: 0,
        stars: FRENCH_WEEKLY_STARS,
      })
    }
  }

  return {
    gold, xp, stars, breakdown,
    hasCombo: combo,
    hasFrenchStreak: frenchStreak,
    hasFrenchWeekly: frenchWeekly,
  }
}

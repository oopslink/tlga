import type { DailyLog, DailyRewards, RewardBreakdownItem, Player } from '@/types'
import {
  calcHomeworkReward, calcMathReward, calcJugglingReward,
  calcLanguageBaseReward,
} from './daily-scoring'
import { calcLanguageBonus } from './language-bonus'
import { calcAllRandomDrops } from './random-drop'
import { getMathMultiplier, applyMathMultiplier } from './math-multiplier'
import { applyLevelGoldBonus, applyLevelStarBonus, calcDreamFund } from './level'
import { calcStreak, calcStreakRewards, isDayActive } from './streak'

export interface DailyCalcInput {
  log: DailyLog
  player: Player
  previousLogs: DailyLog[]  // sorted most recent first (for streak)
  weekLogs: DailyLog[]      // other logs in same week (for french weekly)
}

export interface DailyCalcResult {
  rewards: DailyRewards
  mathMultiplier: number
  streakDay: number
  streakXpBonus: number
  dreamFundContribution: number
}

/**
 * Full daily scoring calculation pipeline:
 *
 * 1. Calculate base rewards for each task
 * 2. Sum base gold / xp / stars
 * 3. Apply level gold bonus (Lv4-6: +20%)  [before math multiplier]
 * 4. Apply math multiplier to total gold (including random drops)
 * 5. Add streak rewards (added after multiplier)
 * 6. Apply level star bonus (Lv7-9: ×2)
 * 7. Calculate dream fund (Lv10: 10% of total gold)
 */
export function calcDailyRewards(input: DailyCalcInput): DailyCalcResult {
  const { log, player, previousLogs, weekLogs } = input
  const breakdown: RewardBreakdownItem[] = []

  // Step 1: Calculate base rewards for each task
  const homeworkReward = calcHomeworkReward(log.homework)
  const mathReward = calcMathReward(log.math)
  const jugglingReward = calcJugglingReward(log.juggling)

  let languageGold = 0
  let languageXp = 0
  let languageStars = 0
  for (const lang of log.languages) {
    const r = calcLanguageBaseReward(lang)
    languageGold += r.gold
    languageXp += r.xp
    languageStars += r.stars
    breakdown.push(...r.breakdown)
  }

  const langBonus = calcLanguageBonus(log.languages, previousLogs, weekLogs)
  const randomDrops = calcAllRandomDrops(log.randomDrops)

  // Collect all breakdowns
  breakdown.unshift(...homeworkReward.breakdown) // insert at front
  // Insert math breakdown after homework
  const homeworkLen = homeworkReward.breakdown.length
  breakdown.splice(homeworkLen, 0, ...mathReward.breakdown)
  // Insert juggling after math
  breakdown.splice(homeworkLen + mathReward.breakdown.length, 0, ...jugglingReward.breakdown)
  // Language breakdowns already added
  breakdown.push(...langBonus.breakdown)
  breakdown.push(...randomDrops.breakdown)

  // Step 2: Sum base rewards
  const baseGold = homeworkReward.gold + mathReward.gold + jugglingReward.gold +
                   languageGold + langBonus.gold + randomDrops.gold
  const baseXp = homeworkReward.xp + mathReward.xp + jugglingReward.xp +
                 languageXp + langBonus.xp + randomDrops.xp
  const baseStars = homeworkReward.stars + jugglingReward.stars +
                    languageStars + langBonus.stars + randomDrops.stars

  // Step 3: Apply level gold bonus (Lv4-6: +20%)
  const goldAfterLevel = applyLevelGoldBonus(baseGold, player.level)
  const levelBonusGold = goldAfterLevel - baseGold
  if (levelBonusGold > 0) {
    breakdown.push({
      source: `等级加成(Lv${player.level}: +20%)`,
      gold: levelBonusGold,
      xp: 0,
      stars: 0,
    })
  }

  // Step 4: Apply math multiplier
  const mathMultiplier = log.math.completed
    ? getMathMultiplier(log.math.difficulty, player.level)
    : 1.0

  const mathMultipliedGold = log.math.completed
    ? applyMathMultiplier(goldAfterLevel, mathMultiplier)
    : goldAfterLevel

  if (log.math.completed && mathMultiplier > 1.0) {
    breakdown.push({
      source: `奥数加成(×${mathMultiplier.toFixed(1)})`,
      gold: mathMultipliedGold - goldAfterLevel,
      xp: 0,
      stars: 0,
    })
  }

  // Step 5: Streak calculation
  const todayActive = isDayActive(log)
  const streakDay = calcStreak(todayActive, previousLogs)
  const streakRewards = calcStreakRewards(streakDay, player.xp + baseXp)

  const totalGoldBeforeStreak = mathMultipliedGold
  const totalGold = totalGoldBeforeStreak + streakRewards.gold
  const totalXp = baseXp + streakRewards.xpBonus
  breakdown.push(...streakRewards.breakdown)

  // Step 6: Apply level star bonus (Lv7-9: ×2)
  const starsAfterLevel = applyLevelStarBonus(baseStars + streakRewards.stars, player.level)
  const levelBonusStars = starsAfterLevel - (baseStars + streakRewards.stars)
  if (levelBonusStars > 0) {
    breakdown.push({
      source: `等级星星加成(Lv${player.level}: ×2)`,
      gold: 0,
      xp: 0,
      stars: levelBonusStars,
    })
  }

  // Step 7: Dream fund
  const dreamFundContribution = calcDreamFund(totalGold, player.level)
  if (dreamFundContribution > 0) {
    breakdown.push({
      source: '梦想基金(10%)',
      gold: dreamFundContribution,
      xp: 0,
      stars: 0,
      note: '额外存入梦想基金',
    })
  }

  const rewards: DailyRewards = {
    baseGold,
    levelBonusGold,
    mathMultipliedGold,
    streakGold: streakRewards.gold,
    totalGold,
    baseXp,
    totalXp,
    baseStars,
    levelBonusStars,
    totalStars: starsAfterLevel,
    breakdown,
  }

  return {
    rewards,
    mathMultiplier,
    streakDay,
    streakXpBonus: streakRewards.xpBonus,
    dreamFundContribution,
  }
}

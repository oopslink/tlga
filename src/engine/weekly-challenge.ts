import type { DailyLog, WeeklyChallenge, Currency, RewardBreakdownItem } from '@/types'
import { WEEKLY_CHALLENGE_BONUS_THRESHOLD, WEEKLY_CHALLENGE_BONUS } from './constants'

export interface WeeklyChallengeResult {
  challenges: WeeklyChallenge[]
  completedCount: number
  bonusEarned: boolean
  rewards: Currency
  breakdown: RewardBreakdownItem[]
}

/**
 * Update weekly challenge progress from daily logs
 */
export function updateChallengeProgress(
  challenges: WeeklyChallenge[],
  weekLogs: DailyLog[],
): WeeklyChallenge[] {
  return challenges.map(challenge => {
    let current = 0

    if (challenge.id.includes('homework')) {
      current = weekLogs.filter(l =>
        l.homework.completed && (l.homework.quality === 'perfect' || l.homework.quality === 'good'),
      ).length
    } else if (challenge.id.includes('math')) {
      current = weekLogs.filter(l =>
        l.math.completed && ['hard', 'competition', 'olympiad'].includes(l.math.difficulty),
      ).length
    } else if (challenge.id.includes('language')) {
      current = weekLogs.filter(l =>
        l.languages.some(lang => lang.completed),
      ).length
    }

    return {
      ...challenge,
      current,
      completed: current >= challenge.target,
    }
  })
}

/**
 * Calculate weekly challenge rewards
 */
export function calcWeeklyChallengeRewards(challenges: WeeklyChallenge[]): WeeklyChallengeResult {
  let gold = 0
  let xp = 0
  let stars = 0
  const breakdown: RewardBreakdownItem[] = []

  const completedCount = challenges.filter(c => c.completed).length

  for (const challenge of challenges) {
    if (challenge.completed) {
      gold += challenge.reward.gold
      xp += challenge.reward.xp
      stars += challenge.reward.stars
      breakdown.push({
        source: `周挑战: ${challenge.title}`,
        gold: challenge.reward.gold,
        xp: challenge.reward.xp,
        stars: challenge.reward.stars,
      })
    }
  }

  const bonusEarned = completedCount >= WEEKLY_CHALLENGE_BONUS_THRESHOLD
  if (bonusEarned) {
    gold += WEEKLY_CHALLENGE_BONUS.gold
    xp += WEEKLY_CHALLENGE_BONUS.xp
    stars += WEEKLY_CHALLENGE_BONUS.stars
    breakdown.push({
      source: `周挑战完成${completedCount}/${challenges.length}奖励`,
      gold: WEEKLY_CHALLENGE_BONUS.gold,
      xp: WEEKLY_CHALLENGE_BONUS.xp,
      stars: WEEKLY_CHALLENGE_BONUS.stars,
    })
  }

  return {
    challenges,
    completedCount,
    bonusEarned,
    rewards: { gold, xp, stars },
    breakdown,
  }
}

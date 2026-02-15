import type { RandomDrop, RewardBreakdownItem } from '@/types'
import { calcRandomDropReward } from './daily-scoring'

export interface RandomDropResult {
  gold: number
  xp: number
  stars: number
  breakdown: RewardBreakdownItem[]
}

/**
 * Calculate total random drop rewards for all drops in a day
 */
export function calcAllRandomDrops(drops: RandomDrop[]): RandomDropResult {
  let gold = 0
  let xp = 0
  let stars = 0
  const breakdown: RewardBreakdownItem[] = []

  for (const drop of drops) {
    const reward = calcRandomDropReward(drop)
    gold += reward.gold
    xp += reward.xp
    stars += reward.stars
    breakdown.push(...reward.breakdown)
  }

  return { gold, xp, stars, breakdown }
}

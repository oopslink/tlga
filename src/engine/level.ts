import {
  XP_PER_LEVEL, MAX_LEVEL,
  GOLD_BONUS_LEVEL_RANGE, GOLD_BONUS_PERCENT,
  STAR_DOUBLE_LEVEL_RANGE,
  DREAM_FUND_LEVEL, DREAM_FUND_PERCENT,
} from './constants'

/**
 * Calculate level from total XP
 */
export function calcLevel(totalXp: number): number {
  for (let lv = MAX_LEVEL; lv >= 1; lv--) {
    if (totalXp >= XP_PER_LEVEL[lv]) {
      return lv
    }
  }
  return 1
}

/**
 * Get XP needed to reach the next level
 */
export function xpToNextLevel(totalXp: number): number {
  const currentLevel = calcLevel(totalXp)
  if (currentLevel >= MAX_LEVEL) return 0
  return XP_PER_LEVEL[currentLevel + 1] - totalXp
}

/**
 * Get XP needed for a specific level
 */
export function xpForLevel(level: number): number {
  if (level < 1 || level > MAX_LEVEL) return 0
  return XP_PER_LEVEL[level]
}

/**
 * Check if level has gold bonus (Lv4-6: +20%)
 */
export function hasGoldBonus(level: number): boolean {
  return level >= GOLD_BONUS_LEVEL_RANGE[0] && level <= GOLD_BONUS_LEVEL_RANGE[1]
}

/**
 * Apply level gold bonus: Lv4-6 +20%
 */
export function applyLevelGoldBonus(gold: number, level: number): number {
  if (hasGoldBonus(level)) {
    return Math.floor(gold * (1 + GOLD_BONUS_PERCENT))
  }
  return gold
}

/**
 * Check if level has star doubling (Lv7-9)
 */
export function hasStarDouble(level: number): boolean {
  return level >= STAR_DOUBLE_LEVEL_RANGE[0] && level <= STAR_DOUBLE_LEVEL_RANGE[1]
}

/**
 * Apply level star bonus: Lv7-9 stars double
 */
export function applyLevelStarBonus(stars: number, level: number): number {
  if (hasStarDouble(level)) {
    return stars * 2
  }
  return stars
}

/**
 * Check if level qualifies for dream fund (Lv10)
 */
export function hasDreamFund(level: number): boolean {
  return level >= DREAM_FUND_LEVEL
}

/**
 * Calculate dream fund contribution from gold
 */
export function calcDreamFund(gold: number, level: number): number {
  if (!hasDreamFund(level)) return 0
  return Math.floor(gold * DREAM_FUND_PERCENT)
}

/**
 * Calculate XP needed to level up from current XP (used by 14-day streak)
 */
export function xpToLevelUp(totalXp: number): number {
  const currentLevel = calcLevel(totalXp)
  if (currentLevel >= MAX_LEVEL) return 0
  return XP_PER_LEVEL[currentLevel + 1] - totalXp
}

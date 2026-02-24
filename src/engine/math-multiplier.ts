import type { MathDifficulty } from '@/types'
import { MATH_MULTIPLIER, MATH_MULTIPLIER_LV10_BONUS, MAX_LEVEL } from './constants'

/**
 * Get the math multiplier based on difficulty and player level.
 *
 * 五模式：
 * - 普通 (basic):     1.0x
 * - 火焰 (medium):    1.5x
 * - 星光 (hard):      2.0x
 * - 钻石 (competition): 2.5x
 * - 王者 (olympiad):  3.0x
 *
 * At Lv10+, an extra +0.2 is added.
 */
export function getMathMultiplier(difficulty: MathDifficulty, playerLevel: number): number {
  const base = MATH_MULTIPLIER[difficulty]
  const levelBonus = playerLevel >= MAX_LEVEL ? MATH_MULTIPLIER_LV10_BONUS : 0
  return base + levelBonus
}

/**
 * Apply math multiplier to a gold amount.
 * Formula: floor(gold * multiplier)
 */
export function applyMathMultiplier(gold: number, multiplier: number): number {
  return Math.floor(gold * multiplier)
}

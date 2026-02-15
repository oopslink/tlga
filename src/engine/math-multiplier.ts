import type { MathDifficulty } from '@/types'
import { MATH_MULTIPLIER, MATH_MULTIPLIER_LV10_BONUS, MAX_LEVEL } from './constants'

/**
 * Get the math multiplier based on difficulty and player level.
 *
 * 5 tiers:
 * - basic: 1.0x
 * - medium: 1.2x
 * - hard: 1.5x
 * - competition: 1.8x
 * - olympiad: 2.0x
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

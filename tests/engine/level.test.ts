import { describe, it, expect } from 'vitest'
import {
  calcLevel, xpToNextLevel, hasGoldBonus, applyLevelGoldBonus,
  hasStarDouble, applyLevelStarBonus, hasDreamFund, calcDreamFund, xpToLevelUp,
} from '@/engine/level'

describe('calcLevel', () => {
  it('returns level 1 for 0 XP', () => {
    expect(calcLevel(0)).toBe(1)
  })

  it('returns level 2 for 100 XP', () => {
    expect(calcLevel(100)).toBe(2)
  })

  it('returns level 4 for 500 XP', () => {
    expect(calcLevel(500)).toBe(4)
  })

  it('returns level 10 for 4000+ XP', () => {
    expect(calcLevel(4000)).toBe(10)
    expect(calcLevel(5000)).toBe(10)
  })
})

describe('xpToNextLevel', () => {
  it('returns XP needed to reach next level', () => {
    expect(xpToNextLevel(0)).toBe(100)
    expect(xpToNextLevel(50)).toBe(50)
    expect(xpToNextLevel(100)).toBe(150) // 250 - 100
  })

  it('returns 0 at max level', () => {
    expect(xpToNextLevel(4000)).toBe(0)
  })
})

describe('hasGoldBonus', () => {
  it('returns true for levels 4-6', () => {
    expect(hasGoldBonus(4)).toBe(true)
    expect(hasGoldBonus(5)).toBe(true)
    expect(hasGoldBonus(6)).toBe(true)
  })

  it('returns false for other levels', () => {
    expect(hasGoldBonus(3)).toBe(false)
    expect(hasGoldBonus(7)).toBe(false)
  })
})

describe('applyLevelGoldBonus', () => {
  it('adds 20% at level 4-6', () => {
    expect(applyLevelGoldBonus(100, 4)).toBe(120)
    expect(applyLevelGoldBonus(100, 5)).toBe(120)
    expect(applyLevelGoldBonus(100, 6)).toBe(120)
  })

  it('returns same value at other levels', () => {
    expect(applyLevelGoldBonus(100, 3)).toBe(100)
    expect(applyLevelGoldBonus(100, 7)).toBe(100)
  })

  it('floors the result', () => {
    expect(applyLevelGoldBonus(33, 4)).toBe(39) // 33 * 1.2 = 39.6 → 39
  })
})

describe('hasStarDouble', () => {
  it('returns true for levels 7-9', () => {
    expect(hasStarDouble(7)).toBe(true)
    expect(hasStarDouble(8)).toBe(true)
    expect(hasStarDouble(9)).toBe(true)
  })

  it('returns false for other levels', () => {
    expect(hasStarDouble(6)).toBe(false)
    expect(hasStarDouble(10)).toBe(false)
  })
})

describe('applyLevelStarBonus', () => {
  it('doubles stars at level 7-9', () => {
    expect(applyLevelStarBonus(5, 7)).toBe(10)
    expect(applyLevelStarBonus(5, 8)).toBe(10)
    expect(applyLevelStarBonus(5, 9)).toBe(10)
  })

  it('returns same value at other levels', () => {
    expect(applyLevelStarBonus(5, 6)).toBe(5)
    expect(applyLevelStarBonus(5, 10)).toBe(5)
  })
})

describe('hasDreamFund', () => {
  it('returns true at level 10', () => {
    expect(hasDreamFund(10)).toBe(true)
  })

  it('returns false below level 10', () => {
    expect(hasDreamFund(9)).toBe(false)
  })
})

describe('calcDreamFund', () => {
  it('returns 10% of gold at level 10', () => {
    expect(calcDreamFund(100, 10)).toBe(10)
  })

  it('returns 0 below level 10', () => {
    expect(calcDreamFund(100, 9)).toBe(0)
  })

  it('floors the result', () => {
    expect(calcDreamFund(33, 10)).toBe(3) // 33 * 0.1 = 3.3 → 3
  })
})

describe('xpToLevelUp', () => {
  it('returns XP needed to level up', () => {
    expect(xpToLevelUp(0)).toBe(100)
    expect(xpToLevelUp(99)).toBe(1)
  })

  it('returns 0 at max level', () => {
    expect(xpToLevelUp(4000)).toBe(0)
  })
})

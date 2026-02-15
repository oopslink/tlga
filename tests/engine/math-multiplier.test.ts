import { describe, it, expect } from 'vitest'
import { getMathMultiplier, applyMathMultiplier } from '@/engine/math-multiplier'

describe('getMathMultiplier', () => {
  it('returns 1.0 for basic difficulty', () => {
    expect(getMathMultiplier('basic', 1)).toBe(1.0)
  })

  it('returns 1.2 for medium difficulty', () => {
    expect(getMathMultiplier('medium', 1)).toBe(1.2)
  })

  it('returns 1.5 for hard difficulty', () => {
    expect(getMathMultiplier('hard', 1)).toBe(1.5)
  })

  it('returns 1.8 for competition difficulty', () => {
    expect(getMathMultiplier('competition', 1)).toBe(1.8)
  })

  it('returns 2.0 for olympiad difficulty', () => {
    expect(getMathMultiplier('olympiad', 1)).toBe(2.0)
  })

  it('adds +0.2 at level 10', () => {
    expect(getMathMultiplier('basic', 10)).toBe(1.2)
    expect(getMathMultiplier('olympiad', 10)).toBe(2.2)
    expect(getMathMultiplier('hard', 10)).toBe(1.7)
  })

  it('does not add bonus below level 10', () => {
    expect(getMathMultiplier('olympiad', 9)).toBe(2.0)
  })
})

describe('applyMathMultiplier', () => {
  it('applies multiplier and floors result', () => {
    expect(applyMathMultiplier(100, 1.5)).toBe(150)
    expect(applyMathMultiplier(33, 1.5)).toBe(49) // 33 * 1.5 = 49.5 → 49
  })

  it('returns same value for 1.0 multiplier', () => {
    expect(applyMathMultiplier(100, 1.0)).toBe(100)
  })
})

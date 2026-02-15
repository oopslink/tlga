import { describe, it, expect } from 'vitest'
import { calcStreak, isDayActive, calcStreakRewards } from '@/engine/streak'
import { createActiveDailyLog, createDailyLog } from '../fixtures/test-data'

describe('isDayActive', () => {
  it('returns true if homework completed', () => {
    expect(isDayActive({
      homework: { completed: true },
      math: { completed: false },
      juggling: { completed: false },
      languages: [],
    })).toBe(true)
  })

  it('returns true if any task completed', () => {
    expect(isDayActive({
      homework: { completed: false },
      math: { completed: true },
      juggling: { completed: false },
      languages: [],
    })).toBe(true)
  })

  it('returns true if any language completed', () => {
    expect(isDayActive({
      homework: { completed: false },
      math: { completed: false },
      juggling: { completed: false },
      languages: [{ completed: true }],
    })).toBe(true)
  })

  it('returns false if nothing completed', () => {
    expect(isDayActive({
      homework: { completed: false },
      math: { completed: false },
      juggling: { completed: false },
      languages: [],
    })).toBe(false)
  })
})

describe('calcStreak', () => {
  it('returns 0 if today not active', () => {
    const prev = [createActiveDailyLog('2026-02-09')]
    expect(calcStreak(false, prev)).toBe(0)
  })

  it('returns 1 for first active day', () => {
    expect(calcStreak(true, [])).toBe(1)
  })

  it('counts consecutive active days', () => {
    const prev = [
      createActiveDailyLog('2026-02-09'),
      createActiveDailyLog('2026-02-08'),
      createActiveDailyLog('2026-02-07'),
    ]
    expect(calcStreak(true, prev)).toBe(4)
  })

  it('breaks on inactive day', () => {
    const prev = [
      createActiveDailyLog('2026-02-09'),
      createDailyLog('2026-02-08', { homework: { completed: false }, math: { completed: false }, juggling: { completed: false }, languages: [] }),
      createActiveDailyLog('2026-02-07'),
    ]
    expect(calcStreak(true, prev)).toBe(2) // today + 2026-02-09
  })
})

describe('calcStreakRewards', () => {
  it('gives 3-day reward on day 3', () => {
    const r = calcStreakRewards(3, 0)
    expect(r.gold).toBe(30)
    expect(r.stars).toBe(1)
    expect(r.triggeredRewards).toContain(3)
  })

  it('gives 7-day reward on day 7', () => {
    const r = calcStreakRewards(7, 0)
    expect(r.gold).toBe(70)
    expect(r.stars).toBe(3)
    expect(r.triggeredRewards).toContain(7)
  })

  it('gives 14-day level-up reward on day 14', () => {
    const r = calcStreakRewards(14, 50) // needs 50 XP to level up
    expect(r.xpBonus).toBe(50)
    expect(r.stars).toBe(8) // 3 (day 7) + 5 (day 14), no day 3 since 14 % 3 = 2
    expect(r.triggeredRewards).toContain(7)
    expect(r.triggeredRewards).toContain(14)
    expect(r.gold).toBe(70) // only day 7 bonus
  })

  it('triggers multiple rewards on day 21', () => {
    const r = calcStreakRewards(21, 0)
    expect(r.triggeredRewards).toContain(3) // 21 % 3 === 0
    expect(r.triggeredRewards).toContain(7) // 21 % 7 === 0
    expect(r.gold).toBe(100) // 30 + 70
  })

  it('triggers 3-day and 7-day on day 21', () => {
    const r = calcStreakRewards(21, 0)
    expect(r.gold).toBe(100) // 30 + 70
    expect(r.stars).toBe(4) // 1 + 3
  })

  it('gives no rewards on non-milestone days', () => {
    const r = calcStreakRewards(5, 0)
    expect(r.gold).toBe(0)
    expect(r.stars).toBe(0)
    expect(r.triggeredRewards).toHaveLength(0)
  })

  it('gives 3-day reward every 3 days', () => {
    expect(calcStreakRewards(6, 0).triggeredRewards).toContain(3)
    expect(calcStreakRewards(9, 0).triggeredRewards).toContain(3)
    expect(calcStreakRewards(12, 0).triggeredRewards).toContain(3)
  })
})

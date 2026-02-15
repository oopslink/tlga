import { describe, it, expect } from 'vitest'
import { calcDailyRewards } from '@/engine/daily-aggregator'
import { createDefaultPlayer, createDailyLog, createHomework, createMath, createLanguage } from '../fixtures/test-data'

describe('calcDailyRewards', () => {
  it('calculates basic homework + math rewards', () => {
    const player = createDefaultPlayer()
    const log = createDailyLog('2026-02-10', {
      homework: createHomework({ completed: true, quality: 'good' }),
      math: createMath({ completed: true, difficulty: 'medium', problems: 3 }),
    })

    const result = calcDailyRewards({ log, player, previousLogs: [], weekLogs: [] })
    expect(result.rewards.totalGold).toBeGreaterThan(0)
    expect(result.rewards.totalXp).toBeGreaterThan(0)
  })

  it('applies level gold bonus at Lv4', () => {
    const player = createDefaultPlayer({ level: 4, xp: 500 })
    const log = createDailyLog('2026-02-10', {
      homework: createHomework({ completed: true, quality: 'good' }), // 15 gold
      math: createMath({ completed: false }),
      juggling: { completed: false, minutes: 0, newRecord: false },
    })

    const result = calcDailyRewards({ log, player, previousLogs: [], weekLogs: [] })
    expect(result.rewards.levelBonusGold).toBeGreaterThan(0)
    // 15 gold * 1.2 = 18, so bonus = 3
    expect(result.rewards.levelBonusGold).toBe(3)
  })

  it('applies math multiplier to total gold', () => {
    const player = createDefaultPlayer()
    const log = createDailyLog('2026-02-10', {
      homework: createHomework({ completed: true, quality: 'good' }), // 15 gold
      math: createMath({ completed: true, difficulty: 'hard', problems: 3 }), // 15 gold base
      juggling: { completed: false, minutes: 0, newRecord: false },
    })

    const result = calcDailyRewards({ log, player, previousLogs: [], weekLogs: [] })
    expect(result.mathMultiplier).toBe(1.5)
    // Base: 15 + 15 = 30, multiplied by 1.5 = 45
    expect(result.rewards.mathMultipliedGold).toBe(45)
  })

  it('applies level bonus before math multiplier', () => {
    const player = createDefaultPlayer({ level: 4, xp: 500 })
    const log = createDailyLog('2026-02-10', {
      homework: createHomework({ completed: true, quality: 'good' }), // 15 gold
      math: createMath({ completed: true, difficulty: 'hard', problems: 3 }), // 15 gold
      juggling: { completed: false, minutes: 0, newRecord: false },
    })

    const result = calcDailyRewards({ log, player, previousLogs: [], weekLogs: [] })
    // Base: 30 → +20% = 36 → ×1.5 = 54
    expect(result.rewards.mathMultipliedGold).toBe(54)
  })

  it('applies level star bonus at Lv7', () => {
    const player = createDefaultPlayer({ level: 7, xp: 1700 })
    const log = createDailyLog('2026-02-10', {
      juggling: { completed: true, minutes: 10, newRecord: true }, // 1 star
      languages: [createLanguage('english-reading'), createLanguage('english-words'), createLanguage('french')], // combo = 1 star
    })

    const result = calcDailyRewards({ log, player, previousLogs: [], weekLogs: [] })
    // 2 base stars × 2 = 4 total
    expect(result.rewards.totalStars).toBe(4)
    expect(result.rewards.levelBonusStars).toBe(2)
  })

  it('calculates streak rewards', () => {
    const player = createDefaultPlayer()
    const prev = [
      createDailyLog('2026-02-09', { homework: { completed: true, quality: 'good', selfChecked: false } }),
      createDailyLog('2026-02-08', { homework: { completed: true, quality: 'good', selfChecked: false } }),
    ]
    const log = createDailyLog('2026-02-10', {
      homework: createHomework({ completed: true }),
    })

    const result = calcDailyRewards({ log, player, previousLogs: prev, weekLogs: [] })
    expect(result.streakDay).toBe(3)
    expect(result.rewards.streakGold).toBe(30) // 3-day reward
  })

  it('calculates dream fund at Lv10', () => {
    const player = createDefaultPlayer({ level: 10, xp: 4000 })
    const log = createDailyLog('2026-02-10', {
      homework: createHomework({ completed: true, quality: 'perfect' }), // 20 gold
      math: createMath({ completed: true, difficulty: 'olympiad', problems: 3 }), // 40 gold
    })

    const result = calcDailyRewards({ log, player, previousLogs: [], weekLogs: [] })
    expect(result.dreamFundContribution).toBeGreaterThan(0)
  })

  it('adds streak XP bonus for 14-day streak', () => {
    const player = createDefaultPlayer({ xp: 80 }) // At 80 XP, needs 20 to reach level 2 (100 XP)
    const prev = Array.from({ length: 13 }, (_, i) =>
      createDailyLog(`2026-02-${String(10 - i - 1).padStart(2, '0')}`, {
        homework: { completed: true, quality: 'good', selfChecked: false },
      })
    ).reverse()

    const log = createDailyLog('2026-02-10', {
      homework: createHomework({ completed: true, quality: 'good' }), // 15 XP
      juggling: { completed: false, minutes: 0, newRecord: false },
      math: createMath({ completed: false }),
    })

    const result = calcDailyRewards({ log, player, previousLogs: prev, weekLogs: [] })
    expect(result.streakDay).toBe(14)
    // Player has 80 XP, gets 10 base XP from homework, so 90 total before streak
    // Needs 100 - 90 = 10 XP to level up, but homework gives 10 XP
    // Actually needs 100 - (80 + 10) = 10 XP bonus
    expect(result.streakXpBonus).toBeGreaterThan(0)
  })

  it('handles language combo bonus', () => {
    const player = createDefaultPlayer()
    const log = createDailyLog('2026-02-10', {
      languages: [
        createLanguage('english-reading'),
        createLanguage('english-words'),
        createLanguage('french'),
      ],
    })

    const result = calcDailyRewards({ log, player, previousLogs: [], weekLogs: [] })
    expect(result.rewards.totalGold).toBeGreaterThan(30 + 20) // base + combo bonus
  })
})

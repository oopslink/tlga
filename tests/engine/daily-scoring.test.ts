import { describe, it, expect } from 'vitest'
import {
  calcHomeworkReward, calcMathReward, calcJugglingReward,
  calcLanguageBaseReward, calcRandomDropReward,
} from '@/engine/daily-scoring'

describe('calcHomeworkReward', () => {
  it('gives 20 gold + 15 xp for perfect', () => {
    const r = calcHomeworkReward({ completed: true, quality: 'perfect', selfChecked: false })
    expect(r.gold).toBe(20)
    expect(r.xp).toBe(15)
  })

  it('gives 15 gold + 10 xp for good', () => {
    const r = calcHomeworkReward({ completed: true, quality: 'good', selfChecked: false })
    expect(r.gold).toBe(15)
    expect(r.xp).toBe(10)
  })

  it('adds 5 gold for self-check', () => {
    const r = calcHomeworkReward({ completed: true, quality: 'good', selfChecked: true })
    expect(r.gold).toBe(20) // 15 + 5
  })

  it('gives 0 for incomplete', () => {
    const r = calcHomeworkReward({ completed: true, quality: 'incomplete', selfChecked: false })
    expect(r.gold).toBe(0)
    expect(r.xp).toBe(0)
  })

  it('gives 0 when not completed', () => {
    const r = calcHomeworkReward({ completed: false, quality: 'perfect', selfChecked: true })
    expect(r.gold).toBe(0)
  })

  it('does not add self-check bonus for incomplete', () => {
    const r = calcHomeworkReward({ completed: true, quality: 'incomplete', selfChecked: true })
    expect(r.gold).toBe(0)
  })
})

describe('calcMathReward', () => {
  it('gives base reward for difficulty', () => {
    const r = calcMathReward({ completed: true, difficulty: 'hard', problems: 3, allCorrect: false })
    expect(r.gold).toBe(15)
    expect(r.xp).toBe(15)
  })

  it('adds all-correct bonus', () => {
    const r = calcMathReward({ completed: true, difficulty: 'hard', problems: 3, allCorrect: true })
    expect(r.gold).toBe(25) // 15 + 10
    expect(r.xp).toBe(25) // 15 + 10
  })

  it('gives 0 when not completed', () => {
    const r = calcMathReward({ completed: false, difficulty: 'olympiad', problems: 5, allCorrect: true })
    expect(r.gold).toBe(0)
  })

  it('gives 0 when 0 problems', () => {
    const r = calcMathReward({ completed: true, difficulty: 'medium', problems: 0, allCorrect: false })
    expect(r.gold).toBe(0)
  })
})

describe('calcJugglingReward', () => {
  it('gives base reward', () => {
    const r = calcJugglingReward({ completed: true, minutes: 10, newRecord: false })
    expect(r.gold).toBe(10)
    expect(r.xp).toBe(10)
    expect(r.stars).toBe(0)
  })

  it('adds extra for 15+ minutes', () => {
    const r = calcJugglingReward({ completed: true, minutes: 15, newRecord: false })
    expect(r.gold).toBe(15) // 10 + 5
    expect(r.xp).toBe(15)
  })

  it('adds new record bonus', () => {
    const r = calcJugglingReward({ completed: true, minutes: 10, newRecord: true })
    expect(r.gold).toBe(25) // 10 + 15
    expect(r.stars).toBe(1)
  })

  it('gives 0 when not completed', () => {
    const r = calcJugglingReward({ completed: false, minutes: 20, newRecord: true })
    expect(r.gold).toBe(0)
  })
})

describe('calcLanguageBaseReward', () => {
  it('gives 10 gold for english-reading', () => {
    const r = calcLanguageBaseReward({ type: 'english-reading', completed: true, minutes: 15 })
    expect(r.gold).toBe(10)
    expect(r.xp).toBe(10)
  })

  it('gives 15 gold for french', () => {
    const r = calcLanguageBaseReward({ type: 'french', completed: true, minutes: 15 })
    expect(r.gold).toBe(15)
    expect(r.xp).toBe(15)
  })

  it('gives 0 when not completed', () => {
    const r = calcLanguageBaseReward({ type: 'french', completed: false, minutes: 0 })
    expect(r.gold).toBe(0)
  })
})

describe('calcRandomDropReward', () => {
  it('gives 15 gold + 1 star for piano', () => {
    const r = calcRandomDropReward({ type: 'piano', completed: true })
    expect(r.gold).toBe(15)
    expect(r.stars).toBe(1)
  })

  it('gives 10 gold + 0 star for handwriting', () => {
    const r = calcRandomDropReward({ type: 'handwriting', completed: true })
    expect(r.gold).toBe(10)
    expect(r.stars).toBe(0)
  })

  it('gives 10 gold + 1 star for social', () => {
    const r = calcRandomDropReward({ type: 'social', completed: true })
    expect(r.gold).toBe(10)
    expect(r.stars).toBe(1)
  })
})

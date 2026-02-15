import { describe, it, expect } from 'vitest'
import { hasLanguageCombo, hasFrenchStreak, countFrenchInWeek, calcLanguageBonus } from '@/engine/language-bonus'
import { createDailyLog, createLanguage } from '../fixtures/test-data'

describe('hasLanguageCombo', () => {
  it('returns true when all 3 types completed', () => {
    expect(hasLanguageCombo([
      createLanguage('english-reading'),
      createLanguage('english-words'),
      createLanguage('french'),
    ])).toBe(true)
  })

  it('returns false when missing one type', () => {
    expect(hasLanguageCombo([
      createLanguage('english-reading'),
      createLanguage('french'),
    ])).toBe(false)
  })

  it('returns false when one is not completed', () => {
    expect(hasLanguageCombo([
      createLanguage('english-reading'),
      createLanguage('english-words'),
      createLanguage('french', false),
    ])).toBe(false)
  })
})

describe('hasFrenchStreak', () => {
  it('returns true for 3 consecutive days of french', () => {
    const today = [createLanguage('french')]
    const prev = [
      createDailyLog('2026-02-09', { languages: [createLanguage('french')] }),
      createDailyLog('2026-02-08', { languages: [createLanguage('french')] }),
    ]
    expect(hasFrenchStreak(today, prev)).toBe(true)
  })

  it('returns false for only 2 consecutive days', () => {
    const today = [createLanguage('french')]
    const prev = [
      createDailyLog('2026-02-09', { languages: [createLanguage('french')] }),
    ]
    expect(hasFrenchStreak(today, prev)).toBe(false)
  })

  it('returns false when today has no french', () => {
    const today = [createLanguage('english-reading')]
    const prev = [
      createDailyLog('2026-02-09', { languages: [createLanguage('french')] }),
      createDailyLog('2026-02-08', { languages: [createLanguage('french')] }),
    ]
    expect(hasFrenchStreak(today, prev)).toBe(false)
  })

  it('breaks streak on gap day', () => {
    const today = [createLanguage('french')]
    const prev = [
      createDailyLog('2026-02-09', { languages: [] }), // gap
      createDailyLog('2026-02-08', { languages: [createLanguage('french')] }),
    ]
    expect(hasFrenchStreak(today, prev)).toBe(false)
  })
})

describe('countFrenchInWeek', () => {
  it('counts french sessions in week including today', () => {
    const today = [createLanguage('french')]
    const weekLogs = [
      createDailyLog('2026-02-09', { languages: [createLanguage('french')] }),
      createDailyLog('2026-02-08', { languages: [createLanguage('french')] }),
      createDailyLog('2026-02-07', { languages: [] }),
    ]
    expect(countFrenchInWeek(today, weekLogs)).toBe(3)
  })
})

describe('calcLanguageBonus', () => {
  it('gives combo bonus when all 3 types completed', () => {
    const today = [
      createLanguage('english-reading'),
      createLanguage('english-words'),
      createLanguage('french'),
    ]
    const result = calcLanguageBonus(today, [], [])
    expect(result.hasCombo).toBe(true)
    expect(result.gold).toBeGreaterThan(0)
  })

  it('gives french streak bonus when 3 consecutive days', () => {
    const today = [createLanguage('french')]
    const prev = [
      createDailyLog('2026-02-09', { languages: [createLanguage('french')] }),
      createDailyLog('2026-02-08', { languages: [createLanguage('french')] }),
    ]
    const result = calcLanguageBonus(today, prev, prev)
    expect(result.hasFrenchStreak).toBe(true)
    expect(result.gold).toBe(30) // french streak bonus
  })

  it('gives french weekly bonus when 5th time in week', () => {
    const today = [createLanguage('french')]
    const weekLogs = [
      createDailyLog('2026-02-09', { languages: [createLanguage('french')] }),
      createDailyLog('2026-02-08', { languages: [createLanguage('french')] }),
      createDailyLog('2026-02-07', { languages: [createLanguage('french')] }),
      createDailyLog('2026-02-06', { languages: [createLanguage('french')] }),
    ]
    const result = calcLanguageBonus(today, weekLogs, weekLogs)
    expect(result.hasFrenchWeekly).toBe(true)
  })
})

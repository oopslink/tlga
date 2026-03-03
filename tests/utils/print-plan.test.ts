import { describe, it, expect } from 'vitest'
import { buildPrintRows } from '@/utils/print-plan'
import type { WeeklyPlan } from '@/types/tasks'

function makePlan(overrides?: Partial<WeeklyPlan>): WeeklyPlan {
  const dates = ['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05', '2026-03-06', '2026-03-07']
  return {
    weekId: '2026-W09',
    startDate: dates[0],
    endDate: dates[6],
    status: 'active',
    dailyPlans: dates.map(date => ({ date, tasks: [] })),
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }
}

describe('buildPrintRows', () => {
  it('returns empty rows for empty plan', () => {
    const plan = makePlan()
    const { rows, dailyGold } = buildPrintRows(plan)
    expect(rows).toHaveLength(0)
    expect(dailyGold).toHaveLength(7)
    expect(dailyGold.every(g => g === 0)).toBe(true)
  })

  it('creates one row per unique taskId', () => {
    const plan = makePlan()
    plan.dailyPlans[1].tasks = [{ taskId: 'homework', note: '' }]
    plan.dailyPlans[2].tasks = [{ taskId: 'homework', note: '' }, { taskId: 'piano', note: '' }]
    const { rows } = buildPrintRows(plan)
    expect(rows).toHaveLength(2)
    expect(rows.map(r => r.taskId)).toContain('homework')
    expect(rows.map(r => r.taskId)).toContain('piano')
  })

  it('cell shows note when note is non-empty', () => {
    const plan = makePlan()
    plan.dailyPlans[1].tasks = [{ taskId: 'homework', note: 'P45-47' }]
    const { rows } = buildPrintRows(plan)
    expect(rows[0].cells[1]).toBe('P45-47')
  })

  it('cell shows targetVariant when note is empty and variant exists', () => {
    const plan = makePlan()
    plan.dailyPlans[2].tasks = [{ taskId: 'math-hard', targetVariant: '正确率80%+', note: '' }]
    const { rows } = buildPrintRows(plan)
    expect(rows[0].cells[2]).toBe('正确率80%+')
  })

  it('cell shows ✓ when task is present but has no note or variant', () => {
    const plan = makePlan()
    plan.dailyPlans[0].tasks = [{ taskId: 'french-reading', note: '' }]
    const { rows } = buildPrintRows(plan)
    expect(rows[0].cells[0]).toBe('✓')
  })

  it('cell is empty string when task not present that day', () => {
    const plan = makePlan()
    plan.dailyPlans[0].tasks = [{ taskId: 'piano', note: '' }]
    const { rows } = buildPrintRows(plan)
    expect(rows[0].cells[1]).toBe('')
    expect(rows[0].cells[6]).toBe('')
  })

  it('sums gold correctly per day', () => {
    const plan = makePlan()
    plan.dailyPlans[0].tasks = [{ taskId: 'homework', note: '' }]
    plan.dailyPlans[1].tasks = [{ taskId: 'homework', note: '' }, { taskId: 'piano', note: '', targetVariant: '练习30分钟' }]
    const { dailyGold } = buildPrintRows(plan)
    expect(dailyGold[0]).toBe(1)   // homework only
    expect(dailyGold[1]).toBe(3)   // homework(1) + piano 30min(2)
  })

  it('handles locked tasks as separate rows keyed by note', () => {
    const plan = makePlan()
    plan.dailyPlans[1].tasks = [{ taskId: '', note: '学校数学作业', isLocked: true }]
    plan.dailyPlans[2].tasks = [{ taskId: '', note: '学校数学作业', isLocked: true }]
    const { rows } = buildPrintRows(plan)
    expect(rows).toHaveLength(1)
    expect(rows[0].label).toBe('学校数学作业')
    expect(rows[0].cells[1]).toBe('✓')
    expect(rows[0].cells[2]).toBe('✓')
  })
})

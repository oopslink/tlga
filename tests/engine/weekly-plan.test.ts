import { describe, it, expect } from 'vitest'
import {
  createWeeklyPlan,
  addTaskToPlan,
  removeTaskFromPlan,
  updatePlanTask,
  activatePlan,
  generateProgressSheet,
  generateAllProgressSheets,
} from '@/engine/weekly-plan'

describe('createWeeklyPlan', () => {
  it('creates a plan with 7 days', () => {
    const plan = createWeeklyPlan('2026-W07')
    expect(plan.dailyPlans).toHaveLength(7)
    expect(plan.weekId).toBe('2026-W07')
  })

  it('initializes as draft with empty tasks', () => {
    const plan = createWeeklyPlan('2026-W07')
    expect(plan.status).toBe('draft')
    expect(plan.dailyPlans.every(d => d.tasks.length === 0)).toBe(true)
  })
})

describe('addTaskToPlan', () => {
  it('adds task to specified day', () => {
    let plan = createWeeklyPlan('2026-W07')
    const date = plan.dailyPlans[0].date

    plan = addTaskToPlan(plan, date, 'homework', '写作业', undefined)

    expect(plan.dailyPlans[0].tasks).toHaveLength(1)
    expect(plan.dailyPlans[0].tasks[0].taskId).toBe('homework')
    expect(plan.dailyPlans[0].tasks[0].note).toBe('写作业')
  })

  it('adds task with target variant', () => {
    let plan = createWeeklyPlan('2026-W07')
    const date = plan.dailyPlans[0].date

    plan = addTaskToPlan(plan, date, 'math-simple', '', '正确率100%')

    expect(plan.dailyPlans[0].tasks[0].targetVariant).toBe('正确率100%')
  })

  it('returns plan unchanged for unknown date', () => {
    const plan = createWeeklyPlan('2026-W07')
    const result = addTaskToPlan(plan, '9999-01-01', 'homework', '', undefined)
    expect(result.dailyPlans.every(d => d.tasks.length === 0)).toBe(true)
  })
})

describe('removeTaskFromPlan', () => {
  it('removes task at given index', () => {
    let plan = createWeeklyPlan('2026-W07')
    const date = plan.dailyPlans[0].date
    plan = addTaskToPlan(plan, date, 'homework', '', undefined)
    plan = addTaskToPlan(plan, date, 'math-simple', '', undefined)

    plan = removeTaskFromPlan(plan, date, 0)

    expect(plan.dailyPlans[0].tasks).toHaveLength(1)
    expect(plan.dailyPlans[0].tasks[0].taskId).toBe('math-simple')
  })
})

describe('updatePlanTask', () => {
  it('updates task properties', () => {
    let plan = createWeeklyPlan('2026-W07')
    const date = plan.dailyPlans[0].date
    plan = addTaskToPlan(plan, date, 'homework', '', undefined)

    plan = updatePlanTask(plan, date, 0, { note: '新备注' })

    expect(plan.dailyPlans[0].tasks[0].note).toBe('新备注')
  })
})

describe('activatePlan', () => {
  it('changes status to active', () => {
    const plan = createWeeklyPlan('2026-W07')
    const activated = activatePlan(plan)
    expect(activated.status).toBe('active')
  })
})

describe('generateProgressSheet', () => {
  it('creates a pending progress sheet from daily plan', () => {
    let plan = createWeeklyPlan('2026-W07')
    const date = plan.dailyPlans[0].date
    plan = addTaskToPlan(plan, date, 'homework', '写作业', undefined)
    plan = addTaskToPlan(plan, date, 'math-simple', '', '正确率100%')

    const sheet = generateProgressSheet(plan.dailyPlans[0], plan.weekId)

    expect(sheet.status).toBe('pending')
    expect(sheet.date).toBe(date)
    expect(sheet.weekId).toBe('2026-W07')
    expect(sheet.tasks).toHaveLength(2)
    expect(sheet.tasks[0].taskId).toBe('homework')
    expect(sheet.tasks[0].note).toBe('写作业')
    expect(sheet.tasks[0].completed).toBe(false)
    expect(sheet.tasks[1].targetVariant).toBe('正确率100%')
    expect(sheet.settled).toBe(false)
    expect(sheet.totalGold).toBe(0)
  })
})

describe('generateAllProgressSheets', () => {
  it('generates sheets for all 7 days', () => {
    const plan = createWeeklyPlan('2026-W07')
    const sheets = generateAllProgressSheets(plan)
    expect(sheets).toHaveLength(7)
  })

  it('includes tasks in generated sheets', () => {
    let plan = createWeeklyPlan('2026-W07')
    plan = addTaskToPlan(plan, plan.dailyPlans[0].date, 'homework', '', undefined)
    plan = addTaskToPlan(plan, plan.dailyPlans[1].date, 'math-simple', '', undefined)

    const sheets = generateAllProgressSheets(plan)

    expect(sheets[0].tasks).toHaveLength(1)
    expect(sheets[1].tasks).toHaveLength(1)
    expect(sheets[2].tasks).toHaveLength(0)
  })
})

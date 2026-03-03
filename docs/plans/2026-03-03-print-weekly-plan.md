# Print Weekly Plan Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "🖨️ 打印计划" button to PlanPage.vue that prints the weekly plan as a landscape table (rows = tasks, columns = 7 days) matching the format of `本周计划.pdf`.

**Architecture:** Extract pure `buildPrintRows()` utility (testable), then add a hidden `.print-view` div in `PlanPage.vue` with `@media print` CSS that hides the normal app and shows only the print table.

**Tech Stack:** Vue 3, TypeScript, Vitest (unit tests), browser `window.print()` + CSS `@media print`

---

### Task 1: Pure utility function `buildPrintRows`

**Files:**
- Create: `src/utils/print-plan.ts`
- Test: `tests/utils/print-plan.test.ts`

The function collects all unique tasks across 7 days and builds a table row per unique task.

**Step 1: Write the failing test**

Create `tests/utils/print-plan.test.ts`:

```typescript
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
    // days 1-6 should be empty for piano
    expect(rows[0].cells[1]).toBe('')
    expect(rows[0].cells[6]).toBe('')
  })

  it('sums gold correctly per day', () => {
    const plan = makePlan()
    // homework = 1 gold, piano default = 1 gold
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
```

**Step 2: Run test to verify it fails**

```bash
cd /Users/oopslink/works/codes/oopslink/tlga
npm test -- tests/utils/print-plan.test.ts
```

Expected: FAIL with "Cannot find module '@/utils/print-plan'"

**Step 3: Implement `src/utils/print-plan.ts`**

```typescript
import type { WeeklyPlan, PlannedTaskItem } from '@/types/tasks'
import { TASK_DEFINITIONS } from '@/types/tasks'

export interface PrintRow {
  taskId: string      // empty string for locked tasks
  label: string       // display name
  cells: string[]     // 7 cells
  isLocked: boolean
}

export interface PrintData {
  rows: PrintRow[]
  dailyGold: number[]
}

function getTaskGold(taskId: string, targetVariant?: string): number {
  const task = TASK_DEFINITIONS.find(t => t.id === taskId)
  if (!task) return 0
  if (targetVariant && task.variants) {
    const v = task.variants.find(v => v.level === targetVariant)
    if (v) return v.gold
  }
  return task.gold
}

function getTaskName(taskId: string): string {
  return TASK_DEFINITIONS.find(t => t.id === taskId)?.name ?? taskId
}

function cellContent(item: PlannedTaskItem): string {
  if (item.isLocked) {
    return item.targetVariant || '✓'
  }
  if (item.note) return item.note
  if (item.targetVariant) return item.targetVariant
  return '✓'
}

export function buildPrintRows(plan: WeeklyPlan): PrintData {
  // rowKey → row index
  const keyToIndex = new Map<string, number>()
  const rows: PrintRow[] = []
  const dailyGold: number[] = Array(7).fill(0)

  plan.dailyPlans.forEach((dp, dayIdx) => {
    dp.tasks.forEach(item => {
      const key = item.isLocked ? `locked:${item.note}` : `task:${item.taskId}`

      if (!keyToIndex.has(key)) {
        const label = item.isLocked ? item.note : getTaskName(item.taskId)
        keyToIndex.set(key, rows.length)
        rows.push({
          taskId: item.isLocked ? '' : item.taskId,
          label,
          cells: Array(7).fill(''),
          isLocked: !!item.isLocked,
        })
      }

      const row = rows[keyToIndex.get(key)!]
      row.cells[dayIdx] = cellContent(item)

      if (!item.isLocked && item.taskId) {
        dailyGold[dayIdx] += getTaskGold(item.taskId, item.targetVariant)
      }
    })
  })

  return { rows, dailyGold }
}
```

**Step 4: Run tests to verify they pass**

```bash
npm test -- tests/utils/print-plan.test.ts
```

Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/utils/print-plan.ts tests/utils/print-plan.test.ts
git commit -m "feat: add buildPrintRows utility for weekly plan print"
```

---

### Task 2: Add print button + print view to PlanPage.vue

**Files:**
- Modify: `src/pages/PlanPage.vue`

**Step 1: Add the print button to the template**

In the `<div class="actions-bar">` section (around line 154), add a print button **after** the existing template buttons:

```html
<button class="btn-action btn-print" @click="handlePrint">🖨️ 打印计划</button>
```

**Step 2: Add the hidden print-view div**

After the closing `</template>` tag of the main content (after the `</div>` that closes `.container`), add this inside the outer `<template>` root at the very bottom, before `</template>`:

```html
<!-- 打印视图（屏幕隐藏，打印时显示） -->
<div class="print-view" v-if="planStore.plan">
  <div class="print-header">
    <div class="print-title">本周计划</div>
    <div class="print-meta">
      <span>姓名：{{ playerStore.player?.name ?? '小学霸' }}</span>
      <span>{{ formatWeekCN(planStore.plan.weekId) }}</span>
      <span>{{ getWeekRangeCN(planStore.plan.weekId) }}</span>
    </div>
  </div>

  <table class="print-table">
    <thead>
      <tr>
        <th class="print-task-col">任务</th>
        <th v-for="dp in planStore.plan.dailyPlans" :key="dp.date" class="print-day-col">
          {{ getDayLabel(dp.date) }}<br>
          <span class="print-date-small">{{ getMonthDay(dp.date) }}</span>
        </th>
        <th class="print-gold-col">预计金币</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in printData.rows" :key="row.taskId || row.label">
        <td class="print-task-name">{{ row.label }}</td>
        <td v-for="(cell, i) in row.cells" :key="i" class="print-cell">{{ cell }}</td>
        <td class="print-row-gold">{{ rowGold(row) }}</td>
      </tr>
    </tbody>
    <tfoot>
      <tr class="print-gold-row">
        <td>预计金币</td>
        <td v-for="(gold, i) in printData.dailyGold" :key="i">{{ gold > 0 ? gold : '' }}</td>
        <td>{{ totalGold }}</td>
      </tr>
    </tfoot>
  </table>
</div>
```

**Step 3: Add script logic**

Add imports at the top of the `<script setup>` block:

```typescript
import { computed } from 'vue'  // already imported — ensure computed is there
import { usePlayerStore } from '@/stores/player.store'
import { buildPrintRows } from '@/utils/print-plan'
import { formatWeekCN, getWeekRangeCN } from '@/utils/date'
```

Add after existing store declarations:

```typescript
const playerStore = usePlayerStore()

const printData = computed(() => {
  if (!planStore.plan) return { rows: [], dailyGold: Array(7).fill(0) }
  return buildPrintRows(planStore.plan)
})

const totalGold = computed(() =>
  printData.value.dailyGold.reduce((s, g) => s + g, 0)
)

function rowGold(row: import('@/utils/print-plan').PrintRow): number {
  if (row.isLocked || !row.taskId) return 0
  return row.cells.reduce((sum, cell, dayIdx) => {
    if (!cell) return sum
    const dp = planStore.plan?.dailyPlans[dayIdx]
    const item = dp?.tasks.find(t => t.taskId === row.taskId)
    const { getTaskReward } = await import('@/utils/tasks')  // NOT OK in sync context
    return sum
  }, 0)
}
```

Actually `rowGold` is simpler — the gold per row is just the sum across days using the same `buildPrintRows` logic. Replace with:

```typescript
function rowGold(row: import('@/utils/print-plan').PrintRow): number {
  if (row.isLocked || !row.taskId) return 0
  const task = TASK_DEFINITIONS.find(t => t.id === row.taskId)
  if (!task) return 0
  let total = 0
  planStore.plan?.dailyPlans.forEach(dp => {
    const item = dp.tasks.find(t => t.taskId === row.taskId)
    if (!item) return
    if (item.targetVariant && task.variants) {
      const v = task.variants.find(v => v.level === item.targetVariant)
      total += v ? v.gold : task.gold
    } else {
      total += task.gold
    }
  })
  return total
}
```

Add `TASK_DEFINITIONS` to the existing import from `@/types/tasks`.

Add the `handlePrint` function:

```typescript
function handlePrint() {
  window.print()
}
```

Add to `onMounted` — load player if not already loaded:

```typescript
onMounted(async () => {
  taskDefinitionsStore.load()
  templateStore.load()
  playerStore.load()  // add this line
  // ... rest of existing onMounted
})
```

**Step 4: Add CSS styles**

In the `<style scoped>` block, add a new style for `.btn-print`:

```css
.btn-print {
  background: linear-gradient(135deg, #4a90d9 0%, #357abd 100%);
  color: white;
}

.btn-print:hover:not(:disabled) {
  box-shadow: 0 4px 14px rgba(74, 144, 217, 0.4);
}
```

Add non-scoped print styles. Since `@media print` needs to apply globally, add a **second `<style>` block** (without `scoped`) at the bottom of the file:

```css
<style>
/* ── 打印视图（屏幕隐藏） ── */
.print-view {
  display: none;
}

/* ── 打印时：隐藏应用，显示打印视图 ── */
@media print {
  #app > div:not(.print-view),
  nav {
    display: none !important;
  }

  .print-view {
    display: block !important;
  }

  @page {
    size: A4 landscape;
    margin: 1cm;
  }

  .print-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid #333;
  }

  .print-title {
    font-size: 20px;
    font-weight: 700;
  }

  .print-meta {
    display: flex;
    gap: 20px;
    font-size: 13px;
    color: #555;
  }

  .print-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }

  .print-table th,
  .print-table td {
    border: 1px solid #ccc;
    padding: 6px 8px;
    text-align: center;
    vertical-align: middle;
  }

  .print-task-col {
    width: 120px;
    text-align: left;
  }

  .print-task-name {
    text-align: left;
    font-weight: 600;
    white-space: nowrap;
  }

  .print-day-col {
    min-width: 70px;
    background: #f5f5f5;
    font-weight: 700;
  }

  .print-date-small {
    font-size: 10px;
    font-weight: 400;
    color: #666;
  }

  .print-gold-col {
    width: 60px;
    background: #fff9e6;
    font-weight: 700;
  }

  .print-cell {
    font-size: 11px;
  }

  .print-row-gold {
    background: #fff9e6;
    font-weight: 700;
  }

  .print-gold-row td {
    background: #fef3cd;
    font-weight: 700;
    font-size: 13px;
  }
}
</style>
```

Note: The `.print-view` must NOT be scoped so it can be targeted by global CSS. The `<style>` block without `scoped` allows this.

However, `v-if="planStore.plan"` means the div only renders when plan is loaded — that is fine since `handlePrint` is only callable when the page is rendered. But the `.print-view` div needs to be **outside** the scoped template container so its CSS class isn't mangled. Since PlanPage is the only page mounted when printing, this works fine with a non-scoped style block.

**Step 5: Manual test**

1. Run `npm run dev`
2. Go to `/plan`
3. Verify button "🖨️ 打印计划" appears in the action bar
4. Click the button
5. In the print dialog, verify:
   - Only the print table is shown (no nav, no normal content)
   - Table has 7 day columns + task name column + gold column
   - Task names display correctly
   - Note/targetVariant shown in cells where applicable, ✓ otherwise
   - Daily gold row sums correctly
   - Page orientation is landscape

**Step 6: Commit**

```bash
git add src/pages/PlanPage.vue src/utils/print-plan.ts
git commit -m "feat: add print weekly plan button with landscape table layout"
```

---

### Task 3: Run full test suite

**Step 1: Run all tests**

```bash
npm test
```

Expected: All tests PASS (including new `print-plan.test.ts`)

**Step 2: Fix any failures**

If tests fail due to import issues with `TASK_DEFINITIONS` in test environment, mock the module:

```typescript
// In print-plan.test.ts, if needed:
import { vi } from 'vitest'
vi.mock('@/types/tasks', async (importOriginal) => {
  const actual = await importOriginal()
  return actual  // use real definitions
})
```

**Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: resolve test issues for print-plan utility"
```

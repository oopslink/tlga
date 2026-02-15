import fs from 'node:fs'
import path from 'node:path'

const DATA_DIR = path.resolve(process.cwd(), 'data')

function writeJson(filePath: string, data: unknown) {
  const fullPath = path.join(DATA_DIR, filePath)
  fs.mkdirSync(path.dirname(fullPath), { recursive: true })
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2))
  console.log(`  ✓ ${filePath}`)
}

console.log('Generating new demo data...')

// Player
const player = {
  name: '小学霸',
  title: '冒险新手',
  level: 1,
  xp: 0,
  xpToNext: 100,
  gold: 0,
  stars: 0,
  streak: 0,
  lastActiveDate: '',
  totalDaysPlayed: 0,
  dreamFund: 0,
  createdAt: '2026-02-10',
}

writeJson('player.json', player)

// Weekly Plan for 2026-W07 (Feb 10-16)
const weeklyPlan = {
  weekId: '2026-W07',
  startDate: '2026-02-10',
  endDate: '2026-02-16',
  dailyGoals: [
    // Monday 2026-02-10
    {
      date: '2026-02-10',
      tasks: [
        { taskId: 'homework', completed: false },
        { taskId: 'math-simple', targetVariant: '正确率80%+', completed: false },
        { taskId: 'juggling', targetVariant: '连续30个', completed: false },
        { taskId: 'english-reading', completed: false },
      ],
      status: 'pending',
    },
    // Tuesday 2026-02-11
    {
      date: '2026-02-11',
      tasks: [
        { taskId: 'homework', completed: false },
        { taskId: 'math-simple', targetVariant: '正确率100%', completed: false },
        { taskId: 'french-reading', completed: false },
        { taskId: 'piano', targetVariant: '练习20分钟', completed: false },
      ],
      status: 'pending',
    },
    // Wednesday 2026-02-12
    {
      date: '2026-02-12',
      tasks: [
        { taskId: 'homework', completed: false },
        { taskId: 'juggling', targetVariant: '连续50个', completed: false },
        { taskId: 'recitation', completed: false },
        { taskId: 'english-reading', completed: false },
        { taskId: 'handwriting', targetVariant: '练习20分钟', completed: false },
      ],
      status: 'pending',
    },
    // Thursday 2026-02-13
    {
      date: '2026-02-13',
      tasks: [
        { taskId: 'homework', completed: false },
        { taskId: 'math-simple', targetVariant: '正确率80%+', completed: false },
        { taskId: 'french-reading', completed: false },
        { taskId: 'polite', completed: false },
      ],
      status: 'pending',
    },
    // Friday 2026-02-14
    {
      date: '2026-02-14',
      tasks: [
        { taskId: 'homework', completed: false },
        { taskId: 'juggling', targetVariant: '连续30个', completed: false },
        { taskId: 'english-reading', completed: false },
        { taskId: 'french-reading', completed: false },
        { taskId: 'piano', targetVariant: '练习30分钟', completed: false },
      ],
      status: 'pending',
    },
    // Saturday 2026-02-15
    {
      date: '2026-02-15',
      tasks: [
        { taskId: 'math-simple', targetVariant: '正确率100%', completed: false },
        { taskId: 'juggling', targetVariant: '连续100个', completed: false },
        { taskId: 'piano', targetVariant: '练习30分钟', completed: false },
        { taskId: 'handwriting', targetVariant: '练习40分钟', completed: false },
      ],
      status: 'pending',
    },
    // Sunday 2026-02-16
    {
      date: '2026-02-16',
      tasks: [
        { taskId: 'recitation', completed: false },
        { taskId: 'english-reading', completed: false },
        { taskId: 'french-reading', completed: false },
        { taskId: 'conflict-resolution', completed: false },
      ],
      status: 'pending',
    },
  ],
  createdAt: '2026-02-10T00:00:00.000Z',
}

writeJson('weeks/2026-W07/plan.json', weeklyPlan)

// Sample completed plan for previous week (2026-W06)
const prevWeekPlan = {
  weekId: '2026-W06',
  startDate: '2026-02-03',
  endDate: '2026-02-09',
  dailyGoals: [
    {
      date: '2026-02-03',
      tasks: [
        { taskId: 'homework', completed: true },
        { taskId: 'math-simple', targetVariant: '正确率80%+', completed: true, achievedVariant: '正确率80%+' },
        { taskId: 'english-reading', completed: true },
      ],
      status: 'completed',
    },
    {
      date: '2026-02-04',
      tasks: [
        { taskId: 'homework', completed: true },
        { taskId: 'juggling', targetVariant: '连续30个', completed: true, achievedVariant: '连续30个' },
        { taskId: 'french-reading', completed: true },
      ],
      status: 'completed',
    },
    {
      date: '2026-02-05',
      tasks: [
        { taskId: 'homework', completed: true },
        { taskId: 'math-simple', targetVariant: '正确率100%', completed: true, achievedVariant: '正确率100%' },
        { taskId: 'piano', targetVariant: '练习20分钟', completed: true, achievedVariant: '练习20分钟' },
      ],
      status: 'completed',
    },
    {
      date: '2026-02-06',
      tasks: [
        { taskId: 'homework', completed: true },
        { taskId: 'english-reading', completed: true },
        { taskId: 'recitation', completed: true },
        { taskId: 'polite', completed: true },
      ],
      status: 'completed',
    },
    {
      date: '2026-02-07',
      tasks: [
        { taskId: 'homework', completed: true },
        { taskId: 'math-simple', targetVariant: '正确率80%+', completed: true, achievedVariant: '正确率100%' },
        { taskId: 'juggling', targetVariant: '连续50个', completed: true, achievedVariant: '连续50个' },
      ],
      status: 'completed',
    },
    {
      date: '2026-02-08',
      tasks: [
        { taskId: 'piano', targetVariant: '练习30分钟', completed: true, achievedVariant: '练习30分钟' },
        { taskId: 'handwriting', targetVariant: '练习20分钟', completed: true, achievedVariant: '练习20分钟' },
        { taskId: 'french-reading', completed: true },
      ],
      status: 'completed',
    },
    {
      date: '2026-02-09',
      tasks: [
        { taskId: 'english-reading', completed: true },
        { taskId: 'french-reading', completed: true },
        { taskId: 'recitation', completed: true },
      ],
      status: 'completed',
    },
  ],
  createdAt: '2026-02-03T00:00:00.000Z',
}

writeJson('weeks/2026-W06/plan.json', prevWeekPlan)

console.log('Demo data generated successfully!')
console.log('\n✨ New system features:')
console.log('  - Weekly planning workflow')
console.log('  - Real task types from your table')
console.log('  - Task variants (different completion levels)')
console.log('  - Language combo rewards')
console.log('  - Daily and weekly summaries')

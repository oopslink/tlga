import fs from 'node:fs'
import path from 'node:path'

const DATA_DIR = path.resolve(process.cwd(), 'data')

function writeJson(filePath: string, data: unknown) {
  const fullPath = path.join(DATA_DIR, filePath)
  fs.mkdirSync(path.dirname(fullPath), { recursive: true })
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2))
  console.log(`  ✓ ${filePath}`)
}

// Generate demo data for the past 2 weeks

const difficulties = ['basic', 'medium', 'hard', 'competition', 'olympiad'] as const
const qualities = ['perfect', 'good', 'ok'] as const

function randomPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function createDailyLog(date: string, dayIndex: number) {
  const isWeekend = new Date(date + 'T00:00:00').getDay() % 6 === 0
  const difficulty = dayIndex > 7 ? randomPick(['hard', 'competition', 'olympiad'] as const) : randomPick(difficulties)
  const doFrench = Math.random() > 0.3
  const doEnglishReading = Math.random() > 0.2
  const doEnglishWords = Math.random() > 0.4

  const languages = []
  if (doEnglishReading) {
    languages.push({ type: 'english-reading', completed: true, minutes: 15 + Math.floor(Math.random() * 15) })
  }
  if (doEnglishWords) {
    languages.push({ type: 'english-words', completed: true, minutes: 10 + Math.floor(Math.random() * 10) })
  }
  if (doFrench) {
    languages.push({ type: 'french', completed: true, minutes: 15 + Math.floor(Math.random() * 15) })
  }

  const randomDrops = []
  if (Math.random() > 0.6) {
    randomDrops.push({ type: 'piano', completed: true, note: '练习曲' })
  }
  if (isWeekend && Math.random() > 0.5) {
    randomDrops.push({ type: 'social', completed: true, note: '和朋友玩耍' })
  }

  return {
    date,
    homework: {
      completed: true,
      quality: randomPick(qualities),
      selfChecked: Math.random() > 0.3,
    },
    math: {
      completed: true,
      difficulty,
      problems: 3 + Math.floor(Math.random() * 5),
      allCorrect: Math.random() > 0.4,
    },
    juggling: {
      completed: Math.random() > 0.2,
      minutes: 10 + Math.floor(Math.random() * 20),
      newRecord: Math.random() > 0.7,
    },
    languages,
    randomDrops,
    rewards: {
      baseGold: 0, levelBonusGold: 0, mathMultipliedGold: 0, streakGold: 0, totalGold: 0,
      baseXp: 0, totalXp: 0, baseStars: 0, levelBonusStars: 0, totalStars: 0, breakdown: [],
    },
    mathMultiplier: 1.0,
    streakDay: dayIndex,
  }
}

console.log('Generating demo data...')

// Generate 2 weeks of data
const startDate = new Date('2026-02-01')
const logs = []

for (let i = 0; i < 13; i++) {
  const d = new Date(startDate)
  d.setDate(d.getDate() + i)
  const dateStr = d.toISOString().split('T')[0]
  const log = createDailyLog(dateStr, i + 1)
  logs.push(log)

  // Determine week
  const tempD = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  tempD.setUTCDate(tempD.getUTCDate() + 4 - (tempD.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(tempD.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((tempD.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  const weekId = `${tempD.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`

  writeJson(`weeks/${weekId}/daily-logs/${dateStr}.json`, log)
}

// Calculate total XP/gold for player
let totalXp = 0
let totalGold = 0
let totalStars = 0

for (const log of logs) {
  // Simple estimation for demo
  totalGold += 40 + Math.floor(Math.random() * 30)
  totalXp += 25 + Math.floor(Math.random() * 20)
  totalStars += Math.floor(Math.random() * 3)
}

const player = {
  name: '小学霸',
  title: '黄金学者',
  level: 4,
  xp: totalXp,
  xpToNext: 800 - totalXp,
  gold: totalGold,
  stars: totalStars,
  streak: 13,
  lastActiveDate: '2026-02-13',
  totalDaysPlayed: 13,
  dreamFund: 0,
  createdAt: '2026-02-01',
}

writeJson('player.json', player)
writeJson('achievements.json', {
  unlocked: [
    { id: 'first-perfect', name: '完美一天', description: '第一次完成所有每日任务', icon: '⭐', hidden: true, unlockedAt: '2026-02-01', reward: { gold: 50, xp: 30, stars: 2 } },
    { id: 'streak-7', name: '七日不败', description: '连续7天完成任务', icon: '🔥', hidden: true, unlockedAt: '2026-02-07', reward: { gold: 70, xp: 40, stars: 3 } },
    { id: 'language-master', name: '语言大师', description: '单日完成所有3种语言学习', icon: '🌍', hidden: true, unlockedAt: '2026-02-05', reward: { gold: 50, xp: 30, stars: 2 } },
  ],
})

// Weekly challenges
writeJson('weeks/2026-W07/weekly-challenge.json', {
  weekId: '2026-W07',
  challenges: [
    { id: '2026-W07-homework-5', title: '作业达人', description: '本周完成5天作业', target: 5, current: 4, reward: { gold: 50, xp: 30, stars: 2 }, completed: false },
    { id: '2026-W07-math-3', title: '数学冲刺', description: '本周完成3天数学练习(hard以上)', target: 3, current: 3, reward: { gold: 60, xp: 40, stars: 3 }, completed: true },
    { id: '2026-W07-language-4', title: '多语种学者', description: '本周完成4天语言学习', target: 4, current: 4, reward: { gold: 50, xp: 30, stars: 2 }, completed: true },
  ],
  challengesCompleted: 2,
  bonusApplied: true,
  totalRewards: { gold: 210, xp: 100, stars: 10 },
})

writeJson('weeks/2026-W07/weekly-summary.json', {
  weekId: '2026-W07',
  daysActive: 5,
  totalGold: 350,
  totalXp: 220,
  totalStars: 12,
  averageMathMultiplier: 1.6,
  longestStreak: 13,
  achievementsUnlocked: [],
  challengesCompleted: 2,
})

// Dungeon progress
writeJson('dungeon.json', {
  dungeons: [
    {
      id: 'math-tower', name: '奥数高塔', icon: '🗼', allCompleted: false,
      completionBonus: { gold: 100, xp: 50, stars: 5 },
      stages: [
        { id: 'math-tower-1', name: '第一层：基础关', description: '完成10道竞赛级以上题目', requirement: 'math-competition-plus', target: 10, current: 8, completed: false, reward: { gold: 50, xp: 30, stars: 2 } },
        { id: 'math-tower-2', name: '第二层：挑战关', description: '完成20道竞赛级以上题目', requirement: 'math-competition-plus', target: 20, current: 8, completed: false, reward: { gold: 80, xp: 50, stars: 3 } },
        { id: 'math-tower-3', name: '第三层：奥数关', description: '完成10道奥数难题', requirement: 'math-olympiad', target: 10, current: 3, completed: false, reward: { gold: 120, xp: 80, stars: 5 } },
      ],
    },
    {
      id: 'french-forest', name: '法语森林', icon: '🌲', allCompleted: false,
      completionBonus: { gold: 80, xp: 40, stars: 5 },
      stages: [
        { id: 'french-forest-1', name: '林间小径', description: '法语学习累计10次', requirement: 'french-count', target: 10, current: 10, completed: true, reward: { gold: 40, xp: 25, stars: 2 } },
        { id: 'french-forest-2', name: '密林深处', description: '法语学习累计25次', requirement: 'french-count', target: 25, current: 10, completed: false, reward: { gold: 70, xp: 40, stars: 3 } },
        { id: 'french-forest-3', name: '森林之心', description: '法语学习累计50次', requirement: 'french-count', target: 50, current: 10, completed: false, reward: { gold: 100, xp: 60, stars: 5 } },
      ],
    },
    {
      id: 'english-ocean', name: '英语海洋', icon: '🌊', allCompleted: false,
      completionBonus: { gold: 80, xp: 40, stars: 5 },
      stages: [
        { id: 'english-ocean-1', name: '浅海探索', description: '英语阅读累计15次', requirement: 'english-reading-count', target: 15, current: 11, completed: false, reward: { gold: 40, xp: 25, stars: 2 } },
        { id: 'english-ocean-2', name: '深海潜行', description: '英语阅读累计40次', requirement: 'english-reading-count', target: 40, current: 11, completed: false, reward: { gold: 70, xp: 40, stars: 3 } },
        { id: 'english-ocean-3', name: '海底宝藏', description: '英语阅读累计80次', requirement: 'english-reading-count', target: 80, current: 11, completed: false, reward: { gold: 100, xp: 60, stars: 5 } },
      ],
    },
  ],
})

writeJson('big-goals.json', {
  goals: [
    { id: 'math-olympiad-prep', name: '奥数冲刺', description: '完成100道竞赛/奥数难题', icon: '🏅', target: 100, current: 11, completed: false, reward: { gold: 500, xp: 300, stars: 20 } },
    { id: 'french-a1', name: '法语入门', description: '法语学习累计达到50次', icon: '🗼', target: 50, current: 10, completed: false, reward: { gold: 300, xp: 200, stars: 15 } },
    { id: 'reading-100', name: '阅读百日', description: '英语阅读累计达到100次', icon: '📚', target: 100, current: 11, completed: false, reward: { gold: 300, xp: 200, stars: 15 } },
    { id: 'streak-30', name: '30天挑战', description: '达成30天连续完成任务', icon: '🔥', target: 30, current: 13, completed: false, reward: { gold: 500, xp: 300, stars: 20 } },
  ],
})

writeJson('wishing-pool.json', {
  wishes: [
    { id: 'w1', description: '去游乐园', starsRequired: 20, createdAt: '2026-02-03', granted: false },
    { id: 'w2', description: '买一本漫画书', starsRequired: 10, createdAt: '2026-02-05', granted: false },
  ],
  totalStarsSpent: 0,
})

writeJson('star-exchange.json', { records: [], totalStarsSpent: 0 })

console.log('Demo data generated successfully!')

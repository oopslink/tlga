import fs from 'node:fs'
import path from 'node:path'

const DATA_DIR = path.resolve(process.cwd(), 'data')

const defaultPlayer = {
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
  createdAt: new Date().toISOString().split('T')[0],
}

const defaultAchievements = { unlocked: [] }

const defaultBigGoals = {
  goals: [
    {
      id: 'math-olympiad-prep',
      name: '奥数冲刺',
      description: '完成100道竞赛/奥数难题',
      icon: '🏅',
      target: 100,
      current: 0,
      completed: false,
      reward: { gold: 500, xp: 300, stars: 20 },
    },
    {
      id: 'french-a1',
      name: '法语入门',
      description: '法语学习累计达到50次',
      icon: '🗼',
      target: 50,
      current: 0,
      completed: false,
      reward: { gold: 300, xp: 200, stars: 15 },
    },
    {
      id: 'reading-100',
      name: '阅读百日',
      description: '英语阅读累计达到100次',
      icon: '📚',
      target: 100,
      current: 0,
      completed: false,
      reward: { gold: 300, xp: 200, stars: 15 },
    },
    {
      id: 'streak-30',
      name: '30天挑战',
      description: '达成30天连续完成任务',
      icon: '🔥',
      target: 30,
      current: 0,
      completed: false,
      reward: { gold: 500, xp: 300, stars: 20 },
    },
  ],
}

const defaultDungeon = {
  dungeons: [
    {
      id: 'math-tower',
      name: '奥数高塔',
      icon: '🗼',
      allCompleted: false,
      completionBonus: { gold: 100, xp: 50, stars: 5 },
      stages: [
        { id: 'math-tower-1', name: '第一层：基础关', description: '完成10道竞赛级以上题目', requirement: 'math-competition-plus', target: 10, current: 0, completed: false, reward: { gold: 50, xp: 30, stars: 2 } },
        { id: 'math-tower-2', name: '第二层：挑战关', description: '完成20道竞赛级以上题目', requirement: 'math-competition-plus', target: 20, current: 0, completed: false, reward: { gold: 80, xp: 50, stars: 3 } },
        { id: 'math-tower-3', name: '第三层：奥数关', description: '完成10道奥数难题', requirement: 'math-olympiad', target: 10, current: 0, completed: false, reward: { gold: 120, xp: 80, stars: 5 } },
      ],
    },
    {
      id: 'french-forest',
      name: '法语森林',
      icon: '🌲',
      allCompleted: false,
      completionBonus: { gold: 80, xp: 40, stars: 5 },
      stages: [
        { id: 'french-forest-1', name: '林间小径', description: '法语学习累计10次', requirement: 'french-count', target: 10, current: 0, completed: false, reward: { gold: 40, xp: 25, stars: 2 } },
        { id: 'french-forest-2', name: '密林深处', description: '法语学习累计25次', requirement: 'french-count', target: 25, current: 0, completed: false, reward: { gold: 70, xp: 40, stars: 3 } },
        { id: 'french-forest-3', name: '森林之心', description: '法语学习累计50次', requirement: 'french-count', target: 50, current: 0, completed: false, reward: { gold: 100, xp: 60, stars: 5 } },
      ],
    },
    {
      id: 'english-ocean',
      name: '英语海洋',
      icon: '🌊',
      allCompleted: false,
      completionBonus: { gold: 80, xp: 40, stars: 5 },
      stages: [
        { id: 'english-ocean-1', name: '浅海探索', description: '英语阅读累计15次', requirement: 'english-reading-count', target: 15, current: 0, completed: false, reward: { gold: 40, xp: 25, stars: 2 } },
        { id: 'english-ocean-2', name: '深海潜行', description: '英语阅读累计40次', requirement: 'english-reading-count', target: 40, current: 0, completed: false, reward: { gold: 70, xp: 40, stars: 3 } },
        { id: 'english-ocean-3', name: '海底宝藏', description: '英语阅读累计80次', requirement: 'english-reading-count', target: 80, current: 0, completed: false, reward: { gold: 100, xp: 60, stars: 5 } },
      ],
    },
  ],
}

const defaultWishingPool = { wishes: [], totalStarsSpent: 0 }
const defaultStarExchange = { records: [], totalStarsSpent: 0 }

function writeJson(filePath: string, data: unknown) {
  const fullPath = path.join(DATA_DIR, filePath)
  fs.mkdirSync(path.dirname(fullPath), { recursive: true })
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2))
  console.log(`  ✓ ${filePath}`)
}

console.log('Initializing data files...')
writeJson('player.json', defaultPlayer)
writeJson('achievements.json', defaultAchievements)
writeJson('big-goals.json', defaultBigGoals)
writeJson('dungeon.json', defaultDungeon)
writeJson('wishing-pool.json', defaultWishingPool)
writeJson('star-exchange.json', defaultStarExchange)
console.log('Done! Data files created in data/')

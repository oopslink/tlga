import type {
  MathDifficulty,
  HomeworkQuality,
  LevelPrivilege,
  StreakReward,
  Achievement,
  Currency,
  BigGoal,
  Dungeon,
  WeeklyChallenge,
} from '@/types'

// ==================== Homework Rewards ====================
export const HOMEWORK_GOLD: Record<HomeworkQuality, number> = {
  perfect: 4,
  good: 3,
  ok: 2,
  incomplete: 0,
}

export const HOMEWORK_SELF_CHECK_BONUS = 1 // extra gold for self-checking

export const HOMEWORK_XP: Record<HomeworkQuality, number> = {
  perfect: 15,
  good: 10,
  ok: 5,
  incomplete: 0,
}

// ==================== Math Rewards ====================
// 五模式：普通(basic) / 火焰(medium) / 星光(hard) / 钻石(competition) / 王者(olympiad)
export const MATH_BASE_GOLD: Record<MathDifficulty, number> = {
  basic: 1,
  medium: 2,
  hard: 3,
  competition: 4,
  olympiad: 5,
}

export const MATH_BASE_XP: Record<MathDifficulty, number> = {
  basic: 5,
  medium: 10,
  hard: 15,
  competition: 20,
  olympiad: 30,
}

export const MATH_ALL_CORRECT_BONUS_GOLD = 10
export const MATH_ALL_CORRECT_BONUS_XP = 10

// ==================== Math Multiplier ====================
// 五模式：普通(basic) / 火焰(medium) / 星光(hard) / 钻石(competition) / 王者(olympiad)
export const MATH_MULTIPLIER: Record<MathDifficulty, number> = {
  basic: 1.0,
  medium: 1.5,
  hard: 2.0,
  competition: 2.5,
  olympiad: 3.0,
}

export const MATH_MULTIPLIER_LV10_BONUS = 0.2

// ==================== Juggling Rewards ====================
export const JUGGLING_BASE_GOLD = 10
export const JUGGLING_BASE_XP = 10
export const JUGGLING_EXTRA_MINUTES_THRESHOLD = 15 // minutes for extra bonus
export const JUGGLING_EXTRA_GOLD = 5
export const JUGGLING_EXTRA_XP = 5
export const JUGGLING_NEW_RECORD_GOLD = 15
export const JUGGLING_NEW_RECORD_STARS = 1

// ==================== Language Rewards ====================
export const LANGUAGE_GOLD = {
  'english-reading': 1,
  'english-words': 1,
  french: 4,
}

export const LANGUAGE_XP = {
  'english-reading': 10,
  'english-words': 10,
  french: 15,
}

// Combo bonus: complete 2 or 3 language tasks in one day
export const LANGUAGE_COMBO_GOLD = 3
export const LANGUAGE_COMBO_XP = 0
export const LANGUAGE_COMBO_STARS = 0

// French consecutive day bonus (3 days) → +2金，无星
export const FRENCH_STREAK_DAYS = 3
export const FRENCH_STREAK_GOLD = 2
export const FRENCH_STREAK_STARS = 0

// French weekly bonus (5 times in a week) → +1星，无金
export const FRENCH_WEEKLY_COUNT = 5
export const FRENCH_WEEKLY_GOLD = 0
export const FRENCH_WEEKLY_STARS = 1

// ==================== Random Drop Rewards ====================
export const RANDOM_DROP_GOLD = {
  piano: 1,
  handwriting: 1,
  social: 2,
}

export const RANDOM_DROP_XP = {
  piano: 10,
  handwriting: 10,
  social: 10,
}

export const RANDOM_DROP_STARS = {
  piano: 1,
  handwriting: 0,
  social: 1,
}

// ==================== Level System ====================
export const XP_PER_LEVEL = [
  0,    // Lv0 (unused)
  0,    // Lv1 starts at 0
  100,  // Lv2 needs 100 XP
  250,  // Lv3 needs 250 XP
  500,  // Lv4
  800,  // Lv5
  1200, // Lv6
  1700, // Lv7
  2300, // Lv8
  3000, // Lv9
  4000, // Lv10
]

export const MAX_LEVEL = 10

// Lv4-6: gold +20%
export const GOLD_BONUS_LEVEL_RANGE = [4, 6] as const
export const GOLD_BONUS_PERCENT = 0.20

// Lv7-9: stars double
export const STAR_DOUBLE_LEVEL_RANGE = [7, 9] as const

// Lv10: dream fund (extra gold saved separately)
export const DREAM_FUND_LEVEL = 10
export const DREAM_FUND_PERCENT = 0.10

export const LEVEL_PRIVILEGES: LevelPrivilege[] = [
  { level: 1, name: '冒险新手', description: '开始你的冒险', effect: '基础奖励' },
  { level: 2, name: '勤奋学徒', description: '坚持就是胜利', effect: '解锁周挑战' },
  { level: 3, name: '知识猎人', description: '知识的力量', effect: '解锁副本' },
  { level: 4, name: '黄金学者', description: '金币加成开始', effect: '金币+20%' },
  { level: 5, name: '精英冒险家', description: '更多金币', effect: '金币+20%' },
  { level: 6, name: '学霸勇士', description: '金币加成持续', effect: '金币+20%' },
  { level: 7, name: '星光魔法师', description: '星星翻倍', effect: '星星×2' },
  { level: 8, name: '传奇探索者', description: '星星翻倍持续', effect: '星星×2' },
  { level: 9, name: '至尊学霸', description: '最强加成', effect: '星星×2' },
  { level: 10, name: '梦想冠军', description: '开启梦想基金', effect: '奥数倍率+0.2 & 梦想基金' },
]

// ==================== Streak System ====================
export const STREAK_REWARDS: StreakReward[] = [
  { days: 3, gold: 30, stars: 1, special: '连击火焰 🔥' },
  { days: 7, gold: 70, stars: 3, special: '一周勇士 ⚔️' },
  { days: 14, gold: 0, stars: 5, special: '升1级 🌟' },
]

// ==================== Achievement Definitions ====================
export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlockedAt'>[] = [
  {
    id: 'first-perfect',
    name: '完美一天',
    description: '第一次完成所有每日任务（4项全部完成）',
    icon: '⭐',
    hidden: true,
    reward: { gold: 50, xp: 30, stars: 2 },
  },
  {
    id: 'math-genius',
    name: '奥数天才',
    description: '累计完成50道奥数题',
    icon: '🧮',
    hidden: true,
    reward: { gold: 100, xp: 50, stars: 5 },
  },
  {
    id: 'streak-7',
    name: '七日不败',
    description: '连续7天完成任务',
    icon: '🔥',
    hidden: true,
    reward: { gold: 70, xp: 40, stars: 3 },
  },
  {
    id: 'streak-30',
    name: '月度传奇',
    description: '连续30天完成任务',
    icon: '🏆',
    hidden: true,
    reward: { gold: 300, xp: 200, stars: 10 },
  },
  {
    id: 'language-master',
    name: '语言大师',
    description: '单日完成所有3种语言学习',
    icon: '🌍',
    hidden: true,
    reward: { gold: 50, xp: 30, stars: 2 },
  },
  {
    id: 'french-lover',
    name: '法语达人',
    description: '法语学习累计达到20次',
    icon: '🇫🇷',
    hidden: true,
    reward: { gold: 80, xp: 50, stars: 5 },
  },
  {
    id: 'dungeon-master',
    name: '副本之王',
    description: '完成所有副本',
    icon: '🏰',
    hidden: true,
    reward: { gold: 200, xp: 100, stars: 10 },
  },
  {
    id: 'gold-hoarder',
    name: '金币收藏家',
    description: '累计获得1000金币',
    icon: '💰',
    hidden: true,
    reward: { gold: 100, xp: 50, stars: 5 },
  },
]

// ==================== Big Goal Definitions ====================
export const BIG_GOAL_DEFINITIONS: BigGoal[] = [
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
]

// ==================== Dungeon Definitions ====================
export function createDefaultDungeons(): Dungeon[] {
  return [
    {
      id: 'math-tower',
      name: '奥数高塔',
      icon: '🗼',
      allCompleted: false,
      completionBonus: { gold: 100, xp: 50, stars: 5 },
      stages: [
        {
          id: 'math-tower-1',
          name: '第一层：基础关',
          description: '完成10道竞赛级以上题目',
          requirement: 'math-competition-plus',
          target: 10,
          current: 0,
          completed: false,
          reward: { gold: 50, xp: 30, stars: 2 },
        },
        {
          id: 'math-tower-2',
          name: '第二层：挑战关',
          description: '完成20道竞赛级以上题目',
          requirement: 'math-competition-plus',
          target: 20,
          current: 0,
          completed: false,
          reward: { gold: 80, xp: 50, stars: 3 },
        },
        {
          id: 'math-tower-3',
          name: '第三层：奥数关',
          description: '完成10道奥数难题',
          requirement: 'math-olympiad',
          target: 10,
          current: 0,
          completed: false,
          reward: { gold: 120, xp: 80, stars: 5 },
        },
      ],
    },
    {
      id: 'french-forest',
      name: '法语森林',
      icon: '🌲',
      allCompleted: false,
      completionBonus: { gold: 80, xp: 40, stars: 5 },
      stages: [
        {
          id: 'french-forest-1',
          name: '林间小径',
          description: '法语学习累计10次',
          requirement: 'french-count',
          target: 10,
          current: 0,
          completed: false,
          reward: { gold: 40, xp: 25, stars: 2 },
        },
        {
          id: 'french-forest-2',
          name: '密林深处',
          description: '法语学习累计25次',
          requirement: 'french-count',
          target: 25,
          current: 0,
          completed: false,
          reward: { gold: 70, xp: 40, stars: 3 },
        },
        {
          id: 'french-forest-3',
          name: '森林之心',
          description: '法语学习累计50次',
          requirement: 'french-count',
          target: 50,
          current: 0,
          completed: false,
          reward: { gold: 100, xp: 60, stars: 5 },
        },
      ],
    },
    {
      id: 'english-ocean',
      name: '英语海洋',
      icon: '🌊',
      allCompleted: false,
      completionBonus: { gold: 80, xp: 40, stars: 5 },
      stages: [
        {
          id: 'english-ocean-1',
          name: '浅海探索',
          description: '英语阅读累计15次',
          requirement: 'english-reading-count',
          target: 15,
          current: 0,
          completed: false,
          reward: { gold: 40, xp: 25, stars: 2 },
        },
        {
          id: 'english-ocean-2',
          name: '深海潜行',
          description: '英语阅读累计40次',
          requirement: 'english-reading-count',
          target: 40,
          current: 0,
          completed: false,
          reward: { gold: 70, xp: 40, stars: 3 },
        },
        {
          id: 'english-ocean-3',
          name: '海底宝藏',
          description: '英语阅读累计80次',
          requirement: 'english-reading-count',
          target: 80,
          current: 0,
          completed: false,
          reward: { gold: 100, xp: 60, stars: 5 },
        },
      ],
    },
  ]
}

// ==================== Default Weekly Challenges ====================
export function createDefaultWeeklyChallenges(weekId: string): WeeklyChallenge[] {
  return [
    {
      id: `${weekId}-homework-5`,
      title: '作业达人',
      description: '本周完成5天作业（good以上）',
      target: 5,
      current: 0,
      reward: { gold: 50, xp: 30, stars: 2 },
      completed: false,
    },
    {
      id: `${weekId}-math-3`,
      title: '数学冲刺',
      description: '本周完成3天数学练习（hard以上）',
      target: 3,
      current: 0,
      reward: { gold: 60, xp: 40, stars: 3 },
      completed: false,
    },
    {
      id: `${weekId}-language-4`,
      title: '多语种学者',
      description: '本周完成4天语言学习',
      target: 4,
      current: 0,
      reward: { gold: 50, xp: 30, stars: 2 },
      completed: false,
    },
  ]
}

// Weekly challenge bonus: complete 2 out of 3
export const WEEKLY_CHALLENGE_BONUS_THRESHOLD = 2
export const WEEKLY_CHALLENGE_BONUS: Currency = { gold: 100, xp: 50, stars: 5 }

// All dungeons cleared bonus
export const ALL_DUNGEONS_CLEARED_BONUS: Currency = { gold: 300, xp: 200, stars: 15 }

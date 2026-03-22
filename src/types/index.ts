import type { ReflectionType, MethodLog } from './tasks'
export type { ReflectionType, MethodLog }

// ==================== Currency ====================
export interface Currency {
  gold: number
  xp: number
  stars: number
}

// ==================== Player ====================
export interface Player {
  name: string
  title: string
  level: number
  xp: number
  xpToNext: number
  gold: number
  stars: number
  streak: number
  lastActiveDate: string // ISO date
  totalDaysPlayed: number
  dreamFund: number // Lv10+ dream fund gold
  createdAt: string
}

// ==================== Daily Tasks ====================
export type HomeworkQuality = 'perfect' | 'good' | 'ok' | 'incomplete'

export interface HomeworkTask {
  completed: boolean
  quality: HomeworkQuality
  selfChecked: boolean
}

export type MathDifficulty = 'basic' | 'medium' | 'hard' | 'competition' | 'olympiad'

export interface MathTask {
  completed: boolean
  difficulty: MathDifficulty
  problems: number // number of problems solved
  allCorrect: boolean
}

export interface JugglingTask {
  completed: boolean
  minutes: number
  newRecord: boolean
}

export type LanguageType = 'english-reading' | 'english-words' | 'french'

export interface LanguageTask {
  type: LanguageType
  completed: boolean
  minutes: number
}

export interface RandomDrop {
  type: 'piano' | 'handwriting' | 'social'
  completed: boolean
  note?: string
}

// ==================== Daily Log ====================
export interface DailyLog {
  date: string // ISO date
  homework: HomeworkTask
  math: MathTask
  juggling: JugglingTask
  languages: LanguageTask[]
  randomDrops: RandomDrop[]
  // Calculated fields (stored for history)
  rewards: DailyRewards
  mathMultiplier: number
  streakDay: number
}

export interface DailyRewards {
  baseGold: number
  levelBonusGold: number
  mathMultipliedGold: number
  streakGold: number
  totalGold: number
  baseXp: number
  totalXp: number
  baseStars: number
  levelBonusStars: number
  totalStars: number
  breakdown: RewardBreakdownItem[]
}

export interface RewardBreakdownItem {
  source: string
  gold: number
  xp: number
  stars: number
  note?: string
}

// ==================== Weekly ====================
export interface WeeklyChallenge {
  id: string
  title: string
  description: string
  target: number
  current: number
  reward: Currency
  completed: boolean
}

export interface WeeklyData {
  weekId: string // e.g. "2026-W07"
  challenges: WeeklyChallenge[]
  challengesCompleted: number
  bonusApplied: boolean // 2/3 completion bonus
  totalRewards: Currency
}

export interface WeeklySummary {
  weekId: string
  daysActive: number
  totalGold: number
  totalXp: number
  totalStars: number
  averageMathMultiplier: number
  longestStreak: number
  achievementsUnlocked: string[]
  challengesCompleted: number
}

// ==================== Dungeon ====================
export type DungeonId = 'math-tower' | 'french-forest' | 'english-ocean'

export interface DungeonStage {
  id: string
  name: string
  description: string
  requirement: string
  target: number
  current: number
  completed: boolean
  reward: Currency
}

export interface Dungeon {
  id: DungeonId
  name: string
  icon: string
  stages: DungeonStage[]
  allCompleted: boolean
  completionBonus: Currency
}

export interface DungeonProgress {
  dungeons: Dungeon[]
  totalCompletionBonus: Currency
  allDungeonsCleared: boolean
}

// ==================== Achievements ====================
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  hidden: boolean
  unlockedAt?: string // ISO date
  reward: Currency
}

export interface AchievementsData {
  unlocked: Achievement[]
  // Hidden achievements are not shown until unlocked
}

// ==================== Big Goals ====================
export type BigGoalId = 'math-olympiad-prep' | 'french-a1' | 'reading-100' | 'streak-30'

export interface BigGoal {
  id: BigGoalId
  name: string
  description: string
  icon: string
  target: number
  current: number
  completed: boolean
  completedAt?: string
  rewardChoice?: 'double-gold' | 'double-stars' | 'special-title'
  reward: Currency
}

export interface BigGoalsData {
  goals: BigGoal[]
}

// ==================== Wishing Pool ====================
export interface Wish {
  id: string
  description: string
  starsRequired: number
  createdAt: string
  grantedAt?: string
  granted: boolean
}

export interface WishingPoolData {
  wishes: Wish[]
  totalStarsSpent: number
}

// ==================== Star Exchange ====================
export interface StarExchangeRecord {
  id: string
  starsSpent: number
  item: string
  date: string
}

export interface StarExchangeData {
  records: StarExchangeRecord[]
  totalStarsSpent: number
}

// ==================== Level Privilege ====================
export interface LevelPrivilege {
  level: number
  name: string
  description: string
  effect: string
}

// ==================== Streak Reward ====================
export interface StreakReward {
  days: number
  gold: number
  stars: number
  special?: string
}

// ==================== Thinking Archive ====================

export interface ThinkingArchiveEntry {
  id: string
  date: string
  weekId: string
  type: ReflectionType
  content: string
  methodLog?: MethodLog
  goldEarned: number
  linkedDate?: string
}

// ==================== Weekly Review ====================

export interface WeeklyReview {
  completed: boolean
  answers: { proudest: string; discovery: string; nextWeek: string }
  goldEarned: number  // 5金
}

// ==================== UI State ====================
export interface Toast {
  id: string
  type: 'achievement' | 'levelup' | 'reward' | 'streak' | 'info'
  title: string
  message: string
  icon?: string
  duration?: number
}

export interface ModalState {
  show: boolean
  component?: string
  props?: Record<string, unknown>
}

import type { DailyLog, Player, HomeworkTask, MathTask, JugglingTask, LanguageTask, RandomDrop } from '@/types'

export function createDefaultPlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: '测试玩家',
    title: '冒险新手',
    level: 1,
    xp: 0,
    xpToNext: 100,
    gold: 0,
    stars: 0,
    streak: 0,
    lastActiveDate: '2026-02-10',
    totalDaysPlayed: 0,
    dreamFund: 0,
    createdAt: '2026-02-01',
    ...overrides,
  }
}

export function createHomework(overrides: Partial<HomeworkTask> = {}): HomeworkTask {
  return {
    completed: true,
    quality: 'good',
    selfChecked: false,
    ...overrides,
  }
}

export function createMath(overrides: Partial<MathTask> = {}): MathTask {
  return {
    completed: true,
    difficulty: 'medium',
    problems: 5,
    allCorrect: false,
    ...overrides,
  }
}

export function createJuggling(overrides: Partial<JugglingTask> = {}): JugglingTask {
  return {
    completed: true,
    minutes: 10,
    newRecord: false,
    ...overrides,
  }
}

export function createLanguage(type: LanguageTask['type'], completed = true): LanguageTask {
  return { type, completed, minutes: 15 }
}

export function createRandomDrop(type: RandomDrop['type'], completed = true): RandomDrop {
  return { type, completed }
}

export function createDailyLog(date: string, overrides: Partial<DailyLog> = {}): DailyLog {
  return {
    date,
    homework: createHomework(),
    math: createMath(),
    juggling: createJuggling(),
    languages: [],
    randomDrops: [],
    rewards: {
      baseGold: 0, levelBonusGold: 0, mathMultipliedGold: 0, streakGold: 0, totalGold: 0,
      baseXp: 0, totalXp: 0, baseStars: 0, levelBonusStars: 0, totalStars: 0, breakdown: [],
    },
    mathMultiplier: 1.0,
    streakDay: 0,
    ...overrides,
  }
}

export function createActiveDailyLog(date: string, overrides: Partial<DailyLog> = {}): DailyLog {
  return createDailyLog(date, {
    homework: createHomework({ completed: true, quality: 'good' }),
    math: createMath({ completed: true }),
    juggling: createJuggling({ completed: true }),
    languages: [createLanguage('english-reading')],
    ...overrides,
  })
}

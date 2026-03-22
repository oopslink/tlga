import type { BigGoal, DailyLog, Currency, RewardBreakdownItem } from '@/types'

/**
 * Update big goal progress from all daily logs
 */
export function updateBigGoalProgress(goals: BigGoal[], allLogs: DailyLog[]): BigGoal[] {
  let mathCompetitionOlympiad = 0
  let frenchCount = 0
  let englishReadingCount = 0
  let maxStreak = 0

  for (const log of allLogs) {
    if (log.math.completed && ['competition', 'olympiad'].includes(log.math.difficulty)) {
      mathCompetitionOlympiad += log.math.problems
    }
    if (log.languages.some(l => l.type === 'french' && l.completed)) {
      frenchCount++
    }
    if (log.languages.some(l => l.type === 'english-reading' && l.completed)) {
      englishReadingCount++
    }
    if (log.streakDay > maxStreak) {
      maxStreak = log.streakDay
    }
  }

  return goals.map(goal => {
    if (goal.completed) return goal

    let current = 0
    switch (goal.id) {
      case 'math-olympiad-prep':
        current = mathCompetitionOlympiad
        break
      case 'french-a1':
        current = frenchCount
        break
      case 'reading-100':
        current = englishReadingCount
        break
      case 'streak-30':
        current = maxStreak
        break
    }

    return {
      ...goal,
      current,
      completed: current >= goal.target,
    }
  })
}

/**
 * Apply reward choice multiplier for a completed big goal
 */
export function applyBigGoalRewardChoice(
  goal: BigGoal,
  choice: 'double-gold' | 'double-stars' | 'special-title',
): { reward: Currency; title?: string } {
  const base = goal.reward

  switch (choice) {
    case 'double-gold':
      return { reward: { gold: base.gold * 2, xp: base.xp, stars: base.stars } }
    case 'double-stars':
      return { reward: { gold: base.gold, xp: base.xp, stars: base.stars * 2 } }
    case 'special-title':
      return {
        reward: base,
        title: getSpecialTitle(goal.id),
      }
  }
}

function getSpecialTitle(goalId: string): string {
  const titles: Record<string, string> = {
    'math-olympiad-prep': '奥数小王子',
    'french-a1': '法语小达人',
    'reading-100': '阅读小博士',
    'streak-30': '坚持之星',
  }
  return titles[goalId] || '冒险之星'
}

/**
 * Calculate big goal completion rewards (for breakdown display)
 */
export function calcBigGoalRewards(
  previousGoals: BigGoal[],
  updatedGoals: BigGoal[],
): { rewards: Currency; breakdown: RewardBreakdownItem[]; newlyCompleted: BigGoal[] } {
  let gold = 0
  let xp = 0
  let stars = 0
  const breakdown: RewardBreakdownItem[] = []
  const newlyCompleted: BigGoal[] = []

  for (let i = 0; i < updatedGoals.length; i++) {
    const prev = previousGoals[i]
    const curr = updatedGoals[i]

    if (curr.completed && !prev.completed) {
      newlyCompleted.push(curr)
      // Base reward (user will choose multiplier later)
      gold += curr.reward.gold
      xp += curr.reward.xp
      stars += curr.reward.stars
      breakdown.push({
        source: `大目标完成: ${curr.name}`,
        gold: curr.reward.gold,
        xp: curr.reward.xp,
        stars: curr.reward.stars,
        note: '待选择翻倍奖励',
      })
    }
  }

  return { rewards: { gold, xp, stars }, breakdown, newlyCompleted }
}

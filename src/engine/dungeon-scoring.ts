import type { DailyLog, Dungeon, DungeonProgress, Currency, RewardBreakdownItem } from '@/types'
import { ALL_DUNGEONS_CLEARED_BONUS } from './constants'

/**
 * Update dungeon progress from all daily logs (cumulative)
 */
export function updateDungeonProgress(dungeons: Dungeon[], allLogs: DailyLog[]): Dungeon[] {
  // Accumulate stats from all logs
  let mathCompetitionPlus = 0
  let mathOlympiad = 0
  let frenchCount = 0
  let englishReadingCount = 0

  for (const log of allLogs) {
    if (log.math.completed) {
      if (['competition', 'olympiad'].includes(log.math.difficulty)) {
        mathCompetitionPlus += log.math.problems
      }
      if (log.math.difficulty === 'olympiad') {
        mathOlympiad += log.math.problems
      }
    }
    if (log.languages.some(l => l.type === 'french' && l.completed)) {
      frenchCount++
    }
    if (log.languages.some(l => l.type === 'english-reading' && l.completed)) {
      englishReadingCount++
    }
  }

  return dungeons.map(dungeon => {
    const stages = dungeon.stages.map(stage => {
      let current = 0
      switch (stage.requirement) {
        case 'math-competition-plus':
          current = mathCompetitionPlus
          break
        case 'math-olympiad':
          current = mathOlympiad
          break
        case 'french-count':
          current = frenchCount
          break
        case 'english-reading-count':
          current = englishReadingCount
          break
      }
      return {
        ...stage,
        current,
        completed: current >= stage.target,
      }
    })

    return {
      ...dungeon,
      stages,
      allCompleted: stages.every(s => s.completed),
    }
  })
}

/**
 * Calculate dungeon rewards for newly completed stages
 */
export function calcDungeonRewards(
  previousDungeons: Dungeon[],
  updatedDungeons: Dungeon[],
): { rewards: Currency; breakdown: RewardBreakdownItem[] } {
  let gold = 0
  let xp = 0
  let stars = 0
  const breakdown: RewardBreakdownItem[] = []

  for (let i = 0; i < updatedDungeons.length; i++) {
    const prev = previousDungeons[i]
    const curr = updatedDungeons[i]

    for (let j = 0; j < curr.stages.length; j++) {
      if (curr.stages[j].completed && !prev.stages[j].completed) {
        const reward = curr.stages[j].reward
        gold += reward.gold
        xp += reward.xp
        stars += reward.stars
        breakdown.push({
          source: `副本: ${curr.name} - ${curr.stages[j].name}`,
          gold: reward.gold,
          xp: reward.xp,
          stars: reward.stars,
        })
      }
    }

    // Dungeon completion bonus
    if (curr.allCompleted && !prev.allCompleted) {
      gold += curr.completionBonus.gold
      xp += curr.completionBonus.xp
      stars += curr.completionBonus.stars
      breakdown.push({
        source: `副本通关: ${curr.name}`,
        gold: curr.completionBonus.gold,
        xp: curr.completionBonus.xp,
        stars: curr.completionBonus.stars,
      })
    }
  }

  return { rewards: { gold, xp, stars }, breakdown }
}

/**
 * Check if all dungeons are cleared
 */
export function checkAllDungeonsCleared(dungeons: Dungeon[]): DungeonProgress {
  const allCleared = dungeons.every(d => d.allCompleted)
  return {
    dungeons,
    totalCompletionBonus: allCleared ? ALL_DUNGEONS_CLEARED_BONUS : { gold: 0, xp: 0, stars: 0 },
    allDungeonsCleared: allCleared,
  }
}

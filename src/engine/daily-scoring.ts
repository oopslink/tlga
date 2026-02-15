import type { HomeworkTask, MathTask, JugglingTask, LanguageTask, RandomDrop, RewardBreakdownItem } from '@/types'
import {
  HOMEWORK_GOLD, HOMEWORK_XP, HOMEWORK_SELF_CHECK_BONUS,
  MATH_BASE_GOLD, MATH_BASE_XP, MATH_ALL_CORRECT_BONUS_GOLD, MATH_ALL_CORRECT_BONUS_XP,
  JUGGLING_BASE_GOLD, JUGGLING_BASE_XP, JUGGLING_EXTRA_MINUTES_THRESHOLD,
  JUGGLING_EXTRA_GOLD, JUGGLING_EXTRA_XP, JUGGLING_NEW_RECORD_GOLD, JUGGLING_NEW_RECORD_STARS,
  LANGUAGE_GOLD, LANGUAGE_XP,
  RANDOM_DROP_GOLD, RANDOM_DROP_XP, RANDOM_DROP_STARS,
} from './constants'

export interface TaskReward {
  gold: number
  xp: number
  stars: number
  breakdown: RewardBreakdownItem[]
}

/**
 * Calculate homework rewards
 */
export function calcHomeworkReward(task: HomeworkTask): TaskReward {
  if (!task.completed) {
    return { gold: 0, xp: 0, stars: 0, breakdown: [] }
  }

  let gold = HOMEWORK_GOLD[task.quality]
  const xp = HOMEWORK_XP[task.quality]
  const breakdown: RewardBreakdownItem[] = [
    { source: `作业(${task.quality})`, gold, xp, stars: 0 },
  ]

  if (task.selfChecked && task.quality !== 'incomplete') {
    gold += HOMEWORK_SELF_CHECK_BONUS
    breakdown.push({ source: '自查加分', gold: HOMEWORK_SELF_CHECK_BONUS, xp: 0, stars: 0 })
  }

  return { gold, xp, stars: 0, breakdown }
}

/**
 * Calculate math rewards (base only, not including multiplier)
 */
export function calcMathReward(task: MathTask): TaskReward {
  if (!task.completed || task.problems === 0) {
    return { gold: 0, xp: 0, stars: 0, breakdown: [] }
  }

  let gold = MATH_BASE_GOLD[task.difficulty]
  let xp = MATH_BASE_XP[task.difficulty]
  const breakdown: RewardBreakdownItem[] = [
    { source: `数学(${task.difficulty})`, gold, xp, stars: 0 },
  ]

  if (task.allCorrect) {
    gold += MATH_ALL_CORRECT_BONUS_GOLD
    xp += MATH_ALL_CORRECT_BONUS_XP
    breakdown.push({ source: '全对奖励', gold: MATH_ALL_CORRECT_BONUS_GOLD, xp: MATH_ALL_CORRECT_BONUS_XP, stars: 0 })
  }

  return { gold, xp, stars: 0, breakdown }
}

/**
 * Calculate juggling rewards
 */
export function calcJugglingReward(task: JugglingTask): TaskReward {
  if (!task.completed) {
    return { gold: 0, xp: 0, stars: 0, breakdown: [] }
  }

  let gold = JUGGLING_BASE_GOLD
  let xp = JUGGLING_BASE_XP
  let stars = 0
  const breakdown: RewardBreakdownItem[] = [
    { source: '颠球训练', gold, xp, stars: 0 },
  ]

  if (task.minutes >= JUGGLING_EXTRA_MINUTES_THRESHOLD) {
    gold += JUGGLING_EXTRA_GOLD
    xp += JUGGLING_EXTRA_XP
    breakdown.push({ source: `超过${JUGGLING_EXTRA_MINUTES_THRESHOLD}分钟`, gold: JUGGLING_EXTRA_GOLD, xp: JUGGLING_EXTRA_XP, stars: 0 })
  }

  if (task.newRecord) {
    gold += JUGGLING_NEW_RECORD_GOLD
    stars += JUGGLING_NEW_RECORD_STARS
    breakdown.push({ source: '新纪录!', gold: JUGGLING_NEW_RECORD_GOLD, xp: 0, stars: JUGGLING_NEW_RECORD_STARS })
  }

  return { gold, xp, stars, breakdown }
}

/**
 * Calculate single language task reward (base only, without combo)
 */
export function calcLanguageBaseReward(task: LanguageTask): TaskReward {
  if (!task.completed) {
    return { gold: 0, xp: 0, stars: 0, breakdown: [] }
  }

  const gold = LANGUAGE_GOLD[task.type]
  const xp = LANGUAGE_XP[task.type]
  const labels = {
    'english-reading': '英语阅读',
    'english-words': '英语单词',
    'french': '法语学习',
  }

  return {
    gold,
    xp,
    stars: 0,
    breakdown: [{ source: labels[task.type], gold, xp, stars: 0 }],
  }
}

/**
 * Calculate random drop rewards
 */
export function calcRandomDropReward(drop: RandomDrop): TaskReward {
  if (!drop.completed) {
    return { gold: 0, xp: 0, stars: 0, breakdown: [] }
  }

  const gold = RANDOM_DROP_GOLD[drop.type]
  const xp = RANDOM_DROP_XP[drop.type]
  const stars = RANDOM_DROP_STARS[drop.type]
  const labels = { piano: '钢琴练习', handwriting: '练字', social: '社交活动' }

  return {
    gold,
    xp,
    stars,
    breakdown: [{ source: labels[drop.type], gold, xp, stars }],
  }
}

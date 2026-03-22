/**
 * Get Sunday-based week string like "2026-W07"
 * A week runs Sunday–Saturday.
 * Week number is determined by the Thursday of the week (same rule as ISO 8601),
 * which keeps week ownership at year boundaries consistent.
 */
export function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  // dayOfWeek: 0=Sun, 1=Mon, ..., 6=Sat
  const dayOfWeek = d.getUTCDay()
  // Find Thursday of this Sunday-to-Saturday week (offset = 4 - dayOfWeek)
  const thursday = new Date(d)
  thursday.setUTCDate(d.getUTCDate() + (4 - dayOfWeek))

  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${thursday.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

/**
 * Get ISO date string like "2026-02-10"
 */
export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Parse ISO date string to Date
 */
export function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00')
}

/**
 * Get today's ISO date
 */
export function today(): string {
  return toISODate(new Date())
}

/**
 * Get current week ID
 */
export function currentWeek(): string {
  return getISOWeek(new Date())
}

/**
 * Get all dates in a given week (Sunday to Saturday)
 */
export function getWeekDates(weekId: string): string[] {
  const [yearStr, weekStr] = weekId.split('-W')
  const year = parseInt(yearStr)
  const week = parseInt(weekStr)

  // Find Jan 4 of the year (always in ISO week 1; we use same anchor)
  const jan4 = new Date(Date.UTC(year, 0, 4))
  // jan4 day-of-week in ISO convention (1=Mon … 7=Sun)
  const jan4ISODay = jan4.getUTCDay() || 7
  // Monday of ISO week 1
  const isoWeek1Monday = new Date(jan4)
  isoWeek1Monday.setUTCDate(jan4.getUTCDate() - jan4ISODay + 1)

  // Sunday of Sunday-based week 1 = ISO week-1 Monday - 1 day
  const sundayWeek1 = new Date(isoWeek1Monday)
  sundayWeek1.setUTCDate(isoWeek1Monday.getUTCDate() - 1)

  // Sunday of target week
  const sunday = new Date(sundayWeek1)
  sunday.setUTCDate(sundayWeek1.getUTCDate() + (week - 1) * 7)

  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday)
    d.setUTCDate(sunday.getUTCDate() + i)
    dates.push(toISODate(d))
  }
  return dates
}

/**
 * Get the previous N dates from a given date (not including the date itself)
 */
export function getPreviousDates(dateStr: string, count: number): string[] {
  const dates: string[] = []
  const d = parseDate(dateStr)
  for (let i = 1; i <= count; i++) {
    const prev = new Date(d)
    prev.setDate(d.getDate() - i)
    dates.push(toISODate(prev))
  }
  return dates
}

/**
 * Format date for display: "2月10日 周一"
 */
export function formatDateCN(dateStr: string): string {
  const d = parseDate(dateStr)
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getMonth() + 1}月${d.getDate()}日 ${weekDays[d.getDay()]}`
}

/**
 * Calculate number of days between two dates
 */
export function daysBetween(date1: string, date2: string): number {
  const d1 = parseDate(date1)
  const d2 = parseDate(date2)
  return Math.round(Math.abs(d2.getTime() - d1.getTime()) / 86400000)
}

/**
 * Get previous week ID
 */
export function getPreviousWeek(weekId: string): string {
  const dates = getWeekDates(weekId)
  const sunday = parseDate(dates[0])
  sunday.setDate(sunday.getDate() - 7)
  return getISOWeek(sunday)
}

/**
 * Get next week ID
 */
export function getNextWeek(weekId: string): string {
  const dates = getWeekDates(weekId)
  const sunday = parseDate(dates[0])
  sunday.setDate(sunday.getDate() + 7)
  return getISOWeek(sunday)
}

/**
 * Format week ID for display: "2026年第7周"
 */
export function formatWeekCN(weekId: string): string {
  const [year, weekStr] = weekId.split('-W')
  const week = parseInt(weekStr)
  return `${year}年第${week}周`
}

/**
 * Get week date range for display: "2月10日 - 2月16日"
 */
export function getWeekRangeCN(weekId: string): string {
  const dates = getWeekDates(weekId)
  const start = parseDate(dates[0])
  const end = parseDate(dates[6])
  return `${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日`
}

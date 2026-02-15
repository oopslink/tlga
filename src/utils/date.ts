/**
 * Get ISO week string like "2026-W07"
 */
export function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
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
 * Get all dates in a given ISO week
 */
export function getWeekDates(weekId: string): string[] {
  const [yearStr, weekStr] = weekId.split('-W')
  const year = parseInt(yearStr)
  const week = parseInt(weekStr)

  // Find Jan 4 of the year (always in week 1)
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const dayOfWeek = jan4.getUTCDay() || 7
  // Monday of week 1
  const mondayWeek1 = new Date(jan4)
  mondayWeek1.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1)

  // Monday of target week
  const monday = new Date(mondayWeek1)
  monday.setUTCDate(mondayWeek1.getUTCDate() + (week - 1) * 7)

  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setUTCDate(monday.getUTCDate() + i)
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

import { addDays, startOfYear, format, getDay, getDaysInYear } from 'date-fns'
import { WEEKLY_SCHEDULE } from './contentTypes.js'

/**
 * Generate a full-year content schedule.
 * @param {number} year  Four-digit year (e.g. 2025)
 * @returns {Array}      Array of content-item objects
 */
export function generateYearSchedule(year) {
  const items = []
  const start = startOfYear(new Date(year, 0, 1))
  const days = getDaysInYear(new Date(year, 0, 1))

  for (let d = 0; d < days; d++) {
    const date = addDays(start, d)
    const dow = getDay(date)
    const platforms = WEEKLY_SCHEDULE[dow] ?? []
    const dateStr = format(date, 'yyyy-MM-dd')

    platforms.forEach((platform) => {
      items.push(makeItem({ date: dateStr, platform }))
    })
  }

  return items
}

export function makeItem({ date, platform, topic = '', brief = '' }) {
  return {
    id: crypto.randomUUID(),
    date,
    platform,
    topic,
    brief,
    status: 'pending',
    content: null,
    model: 'claude',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

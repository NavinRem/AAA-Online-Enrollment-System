/**
 * Utility for parsing and formatting session schedule strings or objects.
 * This helper ensures that varied schedule inputs (legacy strings or new objects)
 * are processed into a predictable format for the UI.
 */

/**
 * Mapping of day abbreviations to full day names for consistent title-cased output.
 */
const DAY_MAP = {
  mon: 'Monday',
  tue: 'Tuesday',
  tues: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}

/**
 * Extracts and formats the day of the week from a schedule source.
 * Supports legacy formats (e.g., "Day: Mon") and standardized objects.
 *
 * @param {string|Object} schedule - Schedule data (string or { day: string })
 * @param {boolean} full - If true, returns full name (e.g. "Monday"), otherwise "MON"
 * @returns {string} The formatted day name or "N/A" if invalid
 */
export const getSessionDay = (schedule, full = false) => {
  if (!schedule) return 'N/A'

  const rawDay = (typeof schedule === 'object' ? schedule.day : String(schedule))
    ?.replace(/Day:/i, '')
    .trim()
    .split(/[\s,:(]/)[0]

  if (!rawDay || rawDay.toLowerCase() === 'n/a') return 'N/A'

  if (full) {
    const key = rawDay.toLowerCase()
    return DAY_MAP[key] || rawDay.charAt(0) + rawDay.slice(1).toLowerCase()
  }

  return rawDay.substring(0, 3)
}

/**
 * Extracts the time slot (e.g., "09:00 - 10:30") from a schedule source.
 * Cleans prefix labels like "Timeslot:" or "Time:" and extracts bracketed content.
 *
 * @param {string|Object} schedule - Schedule data (string or { timeslot: string })
 * @returns {string} The formatted time slot or "TBD" if not found
 */
export const getSessionTime = (schedule) => {
  if (!schedule) return ''
  if (typeof schedule === 'object') {
    return schedule.time || 'TBD'
  }

  const rawStr = String(schedule)
    .replace(/Timeslot:|Time:|Day:/gi, '')
    .trim()

  const match = rawStr.match(/\((.*?)\)/)
  if (match) return match[1]

  const firstWord = rawStr.split(/[\s,:]/)[0]
  if (!firstWord) return rawStr

  return rawStr
    .substring(firstWord.length)
    .replace(/^[\s,:(]+/, '')
    .replace(/\)$/, '')
    .trim()
}


/**
 * Calculates the actual date of a session based on the term start date, the schedule day, and the week index.
 * 
 * @param {string} startDate - The start date of the term (e.g. "2024-05-01")
 * @param {string} scheduleDay - The day of the week for the class (e.g. "Monday")
 * @param {number} sessionIndex - The 1-based index of the session (1 for week 1, 2 for week 2, etc.)
 * @returns {string} The formatted date string (e.g. "Mon, May 6, 2024")
 */
export const calculateSessionDate = (startDate, scheduleDay, sessionIndex) => {
  if (!startDate || !scheduleDay) return ''
  
  const start = new Date(startDate)
  if (isNaN(start.getTime())) return ''

  const dayMap = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6
  }

  const targetDay = dayMap[scheduleDay.toLowerCase()]
  if (targetDay === undefined) return ''

  // Find the first occurrence of targetDay on or after startDate
  let currentDay = start.getDay()
  let daysToAdd = (targetDay - currentDay + 7) % 7
  
  // Calculate the specific session date by adding weeks
  const sessionDate = new Date(start)
  sessionDate.setDate(start.getDate() + daysToAdd + (sessionIndex - 1) * 7)

  return sessionDate.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Calculates the end date of a term that correctly covers all sessions,
 * even when the class schedule day differs from the term's start day.
 *
 * Example: Term starts Sat Aug 1. Ballet class is Wednesday.
 *   → Session 1 lands Wed Aug 5, Session 10 lands Wed Oct 7.
 *   → The term end date should be at least Oct 7, NOT Aug 1 + 9*7 = Sep 29.
 *
 * @param {string} startDate - The term start date (ISO string, e.g. "2024-08-01")
 * @param {number} totalSessions - Total number of weekly sessions
 * @param {string} [scheduleDay] - Optional class day (e.g. "Wednesday"). If omitted, uses startDate's day.
 * @returns {string} ISO date string for the last session date (e.g. "2024-10-07")
 */
export const calculateTermEndDate = (startDate, totalSessions) => {
  if (!startDate || !totalSessions) return ''

  const start = new Date(startDate)
  if (isNaN(start.getTime())) return ''

  // The term duration is exactly totalSessions * 7 days.
  // The end date is 1 day before the end of the final week, to create a strict week-aligned envelope.
  const lastSession = new Date(start)
  lastSession.setDate(start.getDate() + (parseInt(totalSessions) * 7) - 1)

  return lastSession.toISOString().split('T')[0]
}

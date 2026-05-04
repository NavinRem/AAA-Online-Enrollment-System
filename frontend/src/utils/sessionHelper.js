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
    return DAY_MAP[key] || rawDay.charAt(0).toUpperCase() + rawDay.slice(1).toLowerCase()
  }

  return rawDay.substring(0, 3).toUpperCase()
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

  return rawStr.substring(firstWord.length).replace(/^[\s,:(]+/, '').replace(/\)$/, '').trim()
}

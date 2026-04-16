/**
 * Utility for parsing and formatting session schedule strings.
 */

/**
 * Extracts the day of the week from a schedule string or object.
 * @param {string|object} schedule - The schedule data
 * @returns {string} The day (e.g., "Monday")
 */
const DAY_MAP = {
  mon: 'Monday',
  tue: 'Tuesday',
  tues: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  thur: 'Thursday',
  thurs: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}

export const getSessionDay = (schedule, full = false) => {
  if (!schedule) return ''

  const rawDay = (typeof schedule === 'object' && schedule.day)
    ? schedule.day
    : String(schedule)
      .replace(/Day:/i, '')
      .trim()
      .split(/[\s,:]/)[0]

  if (!rawDay) return ''

  if (full) {
    const key = rawDay.toLowerCase()
    return DAY_MAP[key] || rawDay
  }

  return rawDay.substring(0, 3)
}

/**
 * Extracts the time slot from a schedule string or object.
 * @param {string|object} schedule - The schedule data
 * @returns {string} The time (e.g., "13:00 - 15:00")
 */
export const getSessionTime = (schedule) => {
  if (!schedule) return ''
  if (typeof schedule === 'object') {
    return (
      schedule.timeslot || schedule.time || schedule.startTime + ' - ' + schedule.endTime || 'TBD'
    )
  }

  // Robust parsing: strip common prefixes and skip the first word (the day)
  const rawStr = String(schedule)
    .replace(/Timeslot:|Time:|Day:/gi, '')
    .trim()

  const firstWord = rawStr.split(/[\s,:]/)[0]
  if (!firstWord) return rawStr

  return rawStr.substring(firstWord.length).replace(/^[\s,:]+/, '').trim()
}

/**
 * Utility for parsing and formatting session schedule strings.
 */

/**
 * Extracts the day of the week from a schedule string or object.
 * @param {string|object} schedule - The schedule data
 * @returns {string} The day (e.g., "Monday")
 */
export const getSessionDay = (schedule) => {
  if (!schedule) return ''
  if (typeof schedule === 'object' && schedule.day) return schedule.day

  const day = String(schedule)
    .replace(/Day:/i, '')
    .trim()
    .split(/[\s,:]/)[0]
  return day
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

  const dayPart = getSessionDay(schedule)
  const time = String(schedule)
    .replace(/Timeslot:|Time:|Day:/gi, '')
    .replace(dayPart, '')
    .replace(/^[\s,:]+/, '')
    .trim()

  return time
}

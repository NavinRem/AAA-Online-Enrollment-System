/**
 * Utility for time and duration calculations
 */

/**
 * Converts a "HH:mm" string to total minutes from start of day
 * @param {string} timeStr - Time in "HH:mm" format
 * @returns {number} Minutes
 */
export const timeToMinutes = (timeStr) => {
  if (!timeStr || !timeStr.includes(':')) return 0
  const [hours, minutes] = timeStr.split(':').map(Number)
  return (hours || 0) * 60 + (minutes || 0)
}

/**
 * Converts total minutes from start of day to a "HH:mm" string
 * @param {number} totalMinutes - Minutes
 * @returns {string} Time in "HH:mm" format
 */
export const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60) % 24
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/**
 * Calculates end time based on start time and duration
 * @param {string} startTime - "HH:mm"
 * @param {number} duration - Minutes
 * @returns {string} "HH:mm"
 */
export const calculateEndTime = (startTime, duration) => {
  const startMins = timeToMinutes(startTime)
  return minutesToTime(startMins + parseInt(duration || 0))
}

/**
 * Calculates duration in minutes between two "HH:mm" strings
 * @param {string} startTime - "HH:mm"
 * @param {string} endTime - "HH:mm"
 * @returns {number} Duration in minutes
 */
export const calculateDuration = (startTime, endTime) => {
  let startMins = timeToMinutes(startTime)
  let endMins = timeToMinutes(endTime)
  
  // Handle overnight if needed
  if (endMins < startMins) endMins += 24 * 60
  
  return endMins - startMins
}

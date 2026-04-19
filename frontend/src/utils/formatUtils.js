/**
 * Utility functions for data formatting, date parsing, and time calculations.
 * Part of the "Universal Perfect State" data layer.
 */

/**
 * 1. Date & Age Logic
 */

/**
 * Parses various date formats into a standard JS Date object.
 * Supports ISO strings, timestamps, and Firestore Timestamp objects.
 * 
 * @param {any} val - Raw date value
 * @returns {Date} Parsed date object
 */
export const parseDate = (val) => {
  if (!val) return new Date(0)
  if (typeof val === 'object' && 'seconds' in val) return new Date(val.seconds * 1000)
  return new Date(val)
}

/**
 * Formats a date into a human-readable string (e.g., "17 April 2026 at 09:12 PM").
 */
export const formatDate = (val) => {
  if (!val) return 'N/A'
  const date = parseDate(val)
  if (isNaN(date.getTime())) return 'N/A'

  const d = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const t = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  return `${d} at ${t}`
}

/**
 * Formats a date into a long-date string without time (e.g., "17 April 2026").
 */
export const formatDateOnly = (val) => {
  if (!val) return 'N/A'
  const date = parseDate(val)
  return isNaN(date.getTime())
    ? 'N/A'
    : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * Calculates current age based on a birth date.
 * 
 * @param {any} val - Birth date
 * @returns {number|string} Calculated age or "N/A"
 */
export const calculateAge = (val) => {
  if (!val) return 'N/A'
  const date = parseDate(val)
  if (isNaN(date.getTime())) return 'N/A'
  const today = new Date()
  let age = today.getFullYear() - date.getFullYear()
  if (
    today.getMonth() < date.getMonth() ||
    (today.getMonth() === date.getMonth() && today.getDate() < date.getDate())
  )
    age--
  return age
}

/**
 * 2. Time & Duration Logic
 */

/**
 * Converts a 24h time string (HH:mm) into total minutes from midnight.
 */
export const timeToMinutes = (t) => {
  if (!t || !t.includes(':')) return 0
  const [h, m] = t.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

/**
 * Converts total minutes into a 24h time string (HH:mm).
 */
export const minutesToTime = (m) => {
  const h = Math.floor(m / 60) % 24
  const min = m % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

/**
 * Calculates end time based on start time and duration in minutes.
 */
export const calculateEndTime = (start, duration) =>
  minutesToTime(timeToMinutes(start) + parseInt(duration || 0))

/**
 * Calculates the difference in minutes between two time strings.
 */
export const calculateDuration = (start, end) => {
  let s = timeToMinutes(start),
    e = timeToMinutes(end)
  if (e < s) e += 1440
  return e - s
}

/**
 * 3. Financial & Currency Logic
 */

/**
 * Formats a numeric value into a clean price string.
 */
export const formatPrice = (val) => {
  const num = Number(val)
  if (isNaN(num) || val === '' || val === null) return '0'
  return Number(num.toFixed(2)).toString()
}

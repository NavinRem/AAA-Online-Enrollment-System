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
 * Formats a date into a short string (e.g., "17 Apr 26").
 */
export const formatShortDate = (val) => {
  if (!val) return 'N/A'
  const date = parseDate(val)
  if (isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
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
/**
 * 4. Academic Progress Logic
 */

/**
 * Calculates class progress and dynamic status based on term dates and timeslots.
 *
 * @param {string} startDate - Term start date
 * @param {string} endDate - Term end date
 * @param {string} day - Class day (optional)
 * @param {string} time - Class timeslot (optional, e.g. "09:00 AM - 10:30 AM")
 * @param {number} currentCount - Current student count
 * @param {number} capacity - Max capacity
 * @returns {object} Progress stats { week, status, percentage, totalWeeks, isOngoing, isArchived }
 */
export const calculateClassProgress = (startDate, endDate, day = null, time = null) => {
  if (!startDate || !endDate)
    return {
      status: 'N/A',
      week: 0,
      percentage: 0,
      totalWeeks: 0,
      isArchived: false,
      isOngoing: false,
    }

  // Normalize all dates to Local Midnight for consistent comparison
  const normalizeLocal = (d) => {
    const date = parseDate(d)
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
  }

  const todayDate = normalizeLocal(new Date())
  const startDateOnly = normalizeLocal(startDate)
  const endDateOnly = normalizeLocal(endDate)

  // Total weeks in term (Day-inclusive calculation)
  const diffDays = Math.round((endDateOnly - startDateOnly) / (24 * 60 * 60 * 1000)) + 1
  const totalWeeks = Math.ceil(diffDays / 7)

  // Calculate academic progress
  const elapsedMs = todayDate - startDateOnly

  let currentWeek = 0
  let sessionHasPassed = false

  if (elapsedMs >= 0) {
    currentWeek = Math.min(totalWeeks, Math.floor(elapsedMs / (7 * 24 * 60 * 60 * 1000)) + 1)

    // Check if the session for the current week has likely passed
    // (Simple logic: if today is past the start of the week.
    // In a future update, this could be refined with the actual 'day' parameter)
    const currentWeekStartDate = new Date(startDateOnly)
    currentWeekStartDate.setDate(currentWeekStartDate.getDate() + (currentWeek - 1) * 7)
    sessionHasPassed = todayDate > currentWeekStartDate
  }

  const remainingSessions = Math.max(0, totalWeeks - currentWeek + (sessionHasPassed ? 0 : 1))
  const percentage =
    currentWeek === 0 ? 0 : Math.min(100, Math.round((currentWeek / totalWeeks) * 100))

  // ── Status Priority Logic ──

  // 1. Check for Ongoing status (Dynamic temporary override)
  let isOngoing = false
  if (
    todayDate.getTime() >= startDateOnly.getTime() &&
    todayDate.getTime() <= endDateOnly.getTime() &&
    day &&
    time
  ) {
    const today = new Date()
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const todayDayName = dayNames[today.getDay()]

    if (day === todayDayName) {
      const [startStr, endStr] = time.split(' - ')
      if (startStr && endStr) {
        const parseTime = (str) => {
          const [time, period] = str.split(' ')
          let [h, m] = time.split(':').map(Number)
          if (period === 'PM' && h < 12) h += 12
          if (period === 'AM' && h === 12) h = 0
          return h * 60 + m
        }
        const currentMins = today.getHours() * 60 + today.getMinutes()
        if (currentMins >= parseTime(startStr) && currentMins <= parseTime(endStr)) {
          isOngoing = true
        }
      }
    }
  }

  let status = 'active'
  if (todayDate > endDateOnly) {
    status = 'archived'
  } else if (isOngoing) {
    status = 'ongoing'
  } else if (todayDate < startDateOnly) {
    status = 'upcoming'
  }

  return {
    status,
    weekInfo:
      currentWeek === 0
        ? `Starts in ${Math.round(Math.abs(elapsedMs) / (24 * 60 * 60 * 1000))} days`
        : `Week ${currentWeek}/${totalWeeks}`,
    week: currentWeek,
    remainingSessions: status === 'upcoming' ? totalWeeks : remainingSessions,
    percentage,
    totalWeeks,
    isOngoing,
    isArchived: status === 'archived',
  }
}

/**
 * Generates a list of all scheduled session dates for a class based on term and schedule.
 *
 * @param {string} startDate
 * @param {string} dayOfWeek - e.g. "Monday"
 * @param {number} totalSessions - Total number of sessions to generate
 * @param {string} endDate - Optional end date to stop generation
 * @param {Array} excludeDates - Optional list of ISO date strings to skip (holidays, etc.)
 * @returns {Array} List of { id, label, date } objects
 */
export const generateClassSessions = (
  startDate,
  dayOfWeek,
  totalSessions = 12,
  endDate = null,
  excludeDates = [],
) => {
  if (!startDate || !dayOfWeek) return []
  const normalize = (d) => {
    const date = parseDate(d)
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
  }

  const start = normalize(startDate)
  const end = endDate ? normalize(endDate) : null
  const total = parseInt(totalSessions) || 12
  const skippedSet = new Set(
    (excludeDates || []).map((d) => normalize(d).toISOString().split('T')[0]),
  )

  const dates = []
  const dayMap = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  }
  const targetDay = dayMap[dayOfWeek]
  if (targetDay === undefined) return []

  let current = new Date(start)
  // Find first occurrence of the target day
  while (current.getDay() !== targetDay) {
    current.setDate(current.getDate() + 1)
  }

  let sessionsFound = 0
  let safetyCounter = 0
  while (sessionsFound < total && safetyCounter < 365) {
    if (end && current > end) break

    const dateStr = current.toISOString().split('T')[0]
    if (!skippedSet.has(dateStr)) {
      dates.push({
        id: sessionsFound + 1,
        label: `Session ${sessionsFound + 1}`,
        date: new Date(current),
      })
      sessionsFound++
    }
    current.setDate(current.getDate() + 7)
    safetyCounter++
  }
  return dates
}

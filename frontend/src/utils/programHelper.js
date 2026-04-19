/**
 * Helper functions for program-related logic, specifically for session tracking
 * and academic status determination in the "Universal Perfect State" architecture.
 */

/**
 * Calculates the count of total, passed, and remaining sessions within a date range
 * based on a specific weekly recurring day.
 * 
 * @param {string} startDate - ISO or date string for start
 * @param {string} endDate - ISO or date string for end
 * @param {Object} schedule - Schedule object (e.g., { day: 'Monday', timeslot: '09:00 - 10:30' })
 * @returns {Object} { totalSessions, passedSessions, remainingSessions }
 */
export const getSessionCounts = (startDate, endDate, schedule) => {
  if (!startDate || !endDate || !schedule || !schedule.day) {
    return { totalSessions: 0, passedSessions: 0, remainingSessions: 0 }
  }

  const start = new Date(startDate)
  const end = new Date(endDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let dayName = schedule.day
  if (!dayName) {
    dayName = Object.keys(schedule)[0]
  }

  if (!dayName) return { totalSessions: 0, passedSessions: 0, remainingSessions: 0 }

  const dayMap = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  }
  const targetDay = dayMap[dayName.toLowerCase().trim()]

  if (targetDay === undefined) return { totalSessions: 0, passedSessions: 0, remainingSessions: 0 }

  let total = 0
  let passed = 0
  let remaining = 0

  const current = new Date(start)
  while (current <= end) {
    if (current.getDay() === targetDay) {
      total++
      if (current < today) {
        passed++
      } else {
        remaining++
      }
    }
    current.setDate(current.getDate() + 1)
  }

  return { 
    totalSessions: total, 
    passedSessions: passed, 
    remainingSessions: remaining 
  }
}

/**
 * Generates academic statistics for a program based on its time range and schedule.
 * 
 * @param {Object} program - Standardized program record
 * @returns {Object} Purified session statistics
 */
export const calculateProgramStats = (program) => {
  if (!program) return { totalSessions: 0, passedSessions: 0, remainingSessions: 0 }
  const { startDate, endDate, schedule } = program
  return getSessionCounts(startDate, endDate, schedule)
}

/**
 * Determines the semantic visual status of a program based on its lifecycle.
 * Maps current time vs. start/end dates.
 * 
 * @param {Object} program - Standardized program record
 * @returns {string} Semantic status (Upcoming, Ongoing, Completed, Cancelled)
 */
export const getProgramDisplayStatus = (program) => {
  if (!program) return 'Unknown'
  const { status, startDate, endDate } = program
  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (status === 'cancelled') return 'Cancelled'
  if (now < start) return 'Upcoming'
  if (now > end) return 'Completed'
  return 'Ongoing'
}

/**
 * Checks if a specific session is currently active based on real-world time.
 * 
 * @param {Object} session - Session/Lesson record
 * @returns {boolean} True if current time is within session window
 */
export const isSessionInProgress = (session) => {
  if (!session) return false
  const now = new Date()
  const sessionDate = new Date(session.date)
  const sessionStartTime = new Date(session.startTime)
  const sessionEndTime = new Date(session.endTime)

  return now >= sessionDate && now >= sessionStartTime && now <= sessionEndTime
}

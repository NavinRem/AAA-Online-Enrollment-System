/**
 * Helper functions for program-related logic, specifically for class tracking
 * and academic status determination in the "Universal Perfect State" architecture.
 */

/**
 * Calculates the count of total, passed, and remaining classes within a date range
 * based on a specific weekly recurring day.
 *
 * @param {string} startDate - ISO or date string for start
 * @param {string} endDate - ISO or date string for end
 * @param {Object} schedule - Schedule object (e.g., { day: 'Monday', timeslot: '09:00 - 10:30' })
 * @returns {Object} { totalClasses, passedClasses, remainingClasses }
 */

/**
 * Calculates the count of total, passed, and remaining classes within a date range
 * based on a specific weekly recurring day.
 *
 * @param {string} startDate - ISO or date string for start
 * @param {string} endDate - ISO or date string for end
 * @param {Object} schedule - Schedule object (e.g., { day: 'Monday', timeslot: '09:00 - 10:30' })
 * @returns {Object} { totalClasses, passedClasses, remainingClasses }
 */
export const getClassCounts = (startDate, endDate, schedule) => {
  if (!startDate || !endDate || !schedule || !schedule.day) {
    return { totalClasses: 0, passedClasses: 0, remainingClasses: 0 }
  }

  const start = new Date(startDate)
  const end = new Date(endDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let dayName = schedule.day
  if (!dayName) {
    dayName = Object.keys(schedule)[0]
  }

  if (!dayName) return { totalClasses: 0, passedClasses: 0, remainingClasses: 0 }

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

  if (targetDay === undefined) return { totalClasses: 0, passedClasses: 0, remainingClasses: 0 }

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
    total,
    passed,
    remaining,
    totalClasses: total,
    passedClasses: passed,
    remainingClasses: remaining,
  }
}

/**
 * Alias for getClassCounts to support legacy calls.
 */
export const getSessionCounts = getClassCounts

/**
 * Generates academic statistics for a program based on its time range and schedule.
 *
 * @param {Object} program - Standardized program record
 * @returns {Object} Purified class statistics
 */
export const calculateProgramStats = (program) => {
  if (!program) return { totalClasses: 0, passedClasses: 0, remainingClasses: 0 }
  const { startDate, endDate, schedule } = program
  return getClassCounts(startDate, endDate, schedule)
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
 * Checks if a specific class is currently active based on real-world time.
 *
 * @param {Object} classInstance - Class/Lesson record
 * @returns {boolean} True if current time is within class window
 */
export const isClassInProgress = (classInstance) => {
  if (!classInstance) return false
  const now = new Date()
  const classDate = new Date(classInstance.date)
  const classStartTime = new Date(classInstance.startTime)
  const classEndTime = new Date(classInstance.endTime)

  return now >= classDate && now >= classStartTime && now <= classEndTime
}

/**
 * Alias for isClassInProgress to support legacy calls.
 */
export const isSessionInProgress = isClassInProgress

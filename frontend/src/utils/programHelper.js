/**
 * Helper functions for program-related logic.
 */

export const getSessionCounts = (startDate, endDate, schedule) => {
  if (!startDate || !endDate || !schedule || !schedule.day) {
    return { total: 0, passed: 0, remaining: 0 }
  }

  const start = new Date(startDate)
  const end = new Date(endDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Normalize today to start of day

  // Map day string to Date.getDay() index (0=Sunday, 1=Monday, etc.)
  const dayMap = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6
  }
  const targetDay = dayMap[schedule.day.toLowerCase().trim()]
  
  if (targetDay === undefined) return { total: 0, passed: 0, remaining: 0 }

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

  return { total, passed, remaining }
}

export const calculateProgramStats = (program) => {
  if (!program) return { total: 0, passed: 0, remaining: 0 }
  const { startDate, endDate, schedule } = program
  const { total, passed, remaining } = getSessionCounts(startDate, endDate, schedule)
  return { total, passed, remaining }
}

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

export const isSessionInProgress = (session) => {
  if (!session) return false
  const now = new Date()
  const sessionDate = new Date(session.date)
  const sessionStartTime = new Date(session.startTime)
  const sessionEndTime = new Date(session.endTime)

  return now >= sessionDate && now >= sessionStartTime && now <= sessionEndTime
}


  

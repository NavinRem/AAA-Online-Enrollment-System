export const getSessionCounts = (startDate, endDate, schedule) => {
  if (!startDate || !endDate || !schedule) {
    return {
      total: 0,
      passed: 0,
      remaining: 0,
      totalClasses: 0,
      passedClasses: 0,
      remainingClasses: 0,
    }
  }

  const start = new Date(startDate)
  const end = new Date(endDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dayMap = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  }

  let targetDays = []
  if (schedule.day) {
    targetDays.push(dayMap[schedule.day.toLowerCase().trim()])
  } else {
    Object.keys(schedule).forEach((day) => {
      const d = dayMap[day.toLowerCase().trim()]
      if (d !== undefined) targetDays.push(d)
    })
  }

  if (targetDays.length === 0) {
    return {
      total: 0,
      passed: 0,
      remaining: 0,
      totalClasses: 0,
      passedClasses: 0,
      remainingClasses: 0,
    }
  }

  let total = 0
  let passed = 0
  let remaining = 0

  const current = new Date(start)
  while (current <= end) {
    const dayOfWeek = current.getDay()
    if (targetDays.includes(dayOfWeek)) {
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



export const getProgramDisplayStatus = (program) => {
  if (!program) return 'Unknown'
  const { status, startDate, endDate } = program

  if (status === 'cancelled') return 'Cancelled'
  if (status === 'archived') return 'Archived'

  if (!startDate || !endDate) return status || 'Active'

  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (now < start) return 'Upcoming'
  if (now > end) return 'Completed'
  return 'Ongoing'
}
export const isSessionInProgress = (classInstance) => {
  if (!classInstance) return false
  const now = new Date()
  const classDate = new Date(classInstance.date)
  const classStartTime = new Date(classInstance.startTime)
  const classEndTime = new Date(classInstance.endTime)

  return now >= classDate && now >= classStartTime && now <= classEndTime
}

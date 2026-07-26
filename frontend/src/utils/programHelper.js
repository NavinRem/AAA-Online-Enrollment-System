export const getSessionCounts = (startDate, endDate, schedule, officialTotal = null) => {
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
  start.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)
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
  let passed
  let remaining

  const current = new Date(start)
  while (current <= end) {
    const dayOfWeek = current.getDay()
    if (targetDays.includes(dayOfWeek)) {
      total++
    }
    current.setDate(current.getDate() + 1)
  }

  if (officialTotal && !isNaN(officialTotal) && Number(officialTotal) > 0) {
    total = Number(officialTotal)
  }

  if (today < start) {
    passed = 0
  } else if (today > end) {
    passed = total
  } else {
    const daysElapsed = Math.floor((today - start) / (24 * 60 * 60 * 1000))
    passed = Math.min(total, Math.max(0, Math.floor(daysElapsed / 7) + 1))
  }
  remaining = Math.max(0, total - passed)

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

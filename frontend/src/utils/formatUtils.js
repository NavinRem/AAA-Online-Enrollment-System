export const DEFAULT_CAPACITY = 5

export const getLocalTodayStr = () => {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0]
}

export const getUpcomingWeekendStr = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const day = d.getUTCDay()
  if (day >= 1 && day <= 5) {
    d.setUTCDate(d.getUTCDate() + (6 - day))
  }
  return d.toISOString().split('T')[0]
}

export const parseDate = (val) => {
  if (!val) return new Date(0)
  if (typeof val === 'object') {
    if ('seconds' in val) return new Date(val.seconds * 1000)
    if ('_seconds' in val) return new Date(val._seconds * 1000)
    if (typeof val.toDate === 'function') return val.toDate()
  }
  return new Date(val)
}

export const formatDate = (val) => {
  if (!val) return 'N/A'
  const date = parseDate(val)
  if (isNaN(date.getTime())) return 'N/A'

  const d = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const t = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  return `${d} at ${t}`
}

export const formatDateOnly = (val) => {
  if (!val) return 'N/A'
  const date = parseDate(val)
  return isNaN(date.getTime())
    ? 'N/A'
    : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export const formatShortDate = (val) => {
  if (!val) return 'N/A'
  const date = parseDate(val)
  if (isNaN(date.getTime())) return 'N/A'
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  const day = String(date.getDate()).padStart(2, '0')
  const month = months[date.getMonth()]
  const year = String(date.getFullYear()).slice(-2)
  return `${day} ${month} ${year}`
}

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



export const formatPrice = (val) => {
  const num = Number(val)
  if (isNaN(num) || val === '' || val === null) return '0'
  return Number(num.toFixed(2)).toString()
}

export const calculateClassProgress = (startDate, endDate, day = null, time = null, totalSessions = null) => {
  if (!startDate || !endDate)
    return {
      status: 'N/A',
      week: 0,
      percentage: 0,
      totalWeeks: 0,
      isArchived: false,
      isOngoing: false,
    }

  const normalizeLocal = (d) => {
    const date = parseDate(d)
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
  }

  const todayDate = normalizeLocal(new Date())
  const startDateOnly = normalizeLocal(startDate)
  const endDateOnly = normalizeLocal(endDate)

  // 1. Determine the first actual session date (accounts for schedule day offset)
  let firstSessionDate = startDateOnly
  if (day) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const targetDayIndex = dayNames.findIndex((d) => d.toLowerCase() === day.toLowerCase())
    if (targetDayIndex !== -1) {
      const offset = (targetDayIndex - startDateOnly.getDay() + 7) % 7
      firstSessionDate = new Date(startDateOnly)
      firstSessionDate.setDate(startDateOnly.getDate() + offset)
    }
  }

  // 2. Determine total weeks
  const diffDays = Math.round((endDateOnly - startDateOnly) / (24 * 60 * 60 * 1000)) + 1
  const computedTotalWeeks = Math.ceil(diffDays / 7)
  const totalWeeks = totalSessions ? parseInt(totalSessions) : computedTotalWeeks

  // 3. Calculate completed sessions (decrements exactly the day AFTER class)
  let sessionsCompleted = 0
  if (todayDate >= firstSessionDate) {
    const daysElapsed = Math.round((todayDate - firstSessionDate) / (24 * 60 * 60 * 1000))
    const weeksElapsed = Math.floor(daysElapsed / 7)
    const dayInCurrentWeek = daysElapsed % 7
    
    if (dayInCurrentWeek === 0) {
      // Today IS the class day (session not finished yet)
      sessionsCompleted = weeksElapsed
    } else {
      // Today is after the class day (session finished)
      sessionsCompleted = weeksElapsed + 1
    }
  }

  const currentWeek = todayDate < firstSessionDate ? 0 : Math.min(totalWeeks, sessionsCompleted + 1)
  const remainingSessions = Math.max(0, totalWeeks - sessionsCompleted)
  const percentage = totalWeeks === 0 ? 0 : Math.min(100, Math.round((sessionsCompleted / totalWeeks) * 100))

  // 4. Calculate ongoing status
  let isOngoing = false
  if (
    todayDate.getTime() >= firstSessionDate.getTime() &&
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
          const [t, period] = str.split(' ')
          let [h, m] = t.split(':').map(Number)
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
  } else if (todayDate < firstSessionDate) {
    status = 'upcoming'
  }

  const elapsedMs = firstSessionDate - todayDate

  return {
    status,
    weekInfo:
      currentWeek === 0
        ? `Starts in ${Math.max(0, Math.round(elapsedMs / (24 * 60 * 60 * 1000)))} days`
        : `Week ${currentWeek}/${totalWeeks}`,
    week: currentWeek,
    remainingSessions,
    percentage,
    totalWeeks,
    isOngoing,
    isCompleted: status === 'archived' || status === 'completed',
    isArchived: status === 'archived',
  }
}

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

export const calculateOfferingStatus = ({
  termStartDate,
  termEndDate,
  schedule = {},
  program = {},
  offering = {},
  checkOngoing = true,
}) => {
  const capacity = Number(program.capacity)

  const currentCount = Number(offering.currentCount)
  const isFull = currentCount >= capacity

  const progress = calculateClassProgress(
    termStartDate,
    termEndDate,
    schedule.day,
    schedule.time
  )
  let fallbackStatus = progress.status

  if (!termStartDate || !termEndDate) {
    fallbackStatus = offering.status || 'available'
  }

  if (isFull) {
    return 'full'
  } else if (checkOngoing && progress.isOngoing) {
    return 'ongoing'
  }

  // Map term status specifically to class/schedule status
  if (fallbackStatus === 'active') return 'available'
  if (fallbackStatus === 'archived') return 'completed'

  return fallbackStatus
}

export const sortSchedulesChronologically = (schedulesArray) => {
  if (!schedulesArray || !Array.isArray(schedulesArray)) return []

  const parse12hToMinutes = (time12h) => {
    if (!time12h) return 0
    const startStr = time12h.split(' - ')[0]
    if (!startStr) return 0
    const parts = startStr.split(' ')
    if (parts.length < 2) return 0
    const [time, period] = parts
    let [hours, minutes] = time.split(':').map(Number)
    if (period === 'PM' && hours < 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0
    return hours * 60 + (minutes || 0)
  }

  const dayOrder = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
    Sunday: 7,
  }

  return [...schedulesArray].sort((a, b) => {
    const dayA = dayOrder[a.day] || 99
    const dayB = dayOrder[b.day] || 99
    
    if (dayA !== dayB) return dayA - dayB
    
    const minsA = parse12hToMinutes(a.time)
    const minsB = parse12hToMinutes(b.time)
    return minsA - minsB
  })
}

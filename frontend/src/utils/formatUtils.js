export const DEFAULT_CAPACITY = 5

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

export const timeToMinutes = (t) => {
  if (!t || !t.includes(':')) return 0
  const [h, m] = t.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export const minutesToTime = (m) => {
  const h = Math.floor(m / 60) % 24
  const min = m % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

export const calculateEndTime = (start, duration) =>
  minutesToTime(timeToMinutes(start) + parseInt(duration || 0))

export const calculateDuration = (start, end) => {
  let s = timeToMinutes(start),
    e = timeToMinutes(end)
  if (e < s) e += 1440
  return e - s
}

export const formatPrice = (val) => {
  const num = Number(val)
  if (isNaN(num) || val === '' || val === null) return '0'
  return Number(num.toFixed(2)).toString()
}

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

  const normalizeLocal = (d) => {
    const date = parseDate(d)
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
  }

  const todayDate = normalizeLocal(new Date())
  const startDateOnly = normalizeLocal(startDate)
  const endDateOnly = normalizeLocal(endDate)

  const diffDays = Math.round((endDateOnly - startDateOnly) / (24 * 60 * 60 * 1000)) + 1
  const totalWeeks = Math.ceil(diffDays / 7)

  const elapsedMs = todayDate - startDateOnly

  let currentWeek = 0
  let sessionHasPassed = false

  if (elapsedMs >= 0) {
    currentWeek = Math.min(totalWeeks, Math.floor(elapsedMs / (7 * 24 * 60 * 60 * 1000)) + 1)
    const currentWeekStartDate = new Date(startDateOnly)
    currentWeekStartDate.setDate(currentWeekStartDate.getDate() + (currentWeek - 1) * 7)
    sessionHasPassed = todayDate > currentWeekStartDate
  }

  const remainingSessions = Math.max(0, totalWeeks - currentWeek + (sessionHasPassed ? 0 : 1))
  const percentage =
    currentWeek === 0 ? 0 : Math.min(100, Math.round((currentWeek / totalWeeks) * 100))

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

  let status = 'available'

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
    fallbackStatus = offering.status
  }

  if (isFull) {
    return 'full'
  } else if (checkOngoing && progress.isOngoing) {
    return 'ongoing'
  }

  return fallbackStatus
}

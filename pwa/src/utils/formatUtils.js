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

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()

  const rawHour = date.getHours()
  const period = rawHour >= 12 ? 'PM' : 'AM'
  const hour12 = rawHour % 12 || 12
  const minute = String(date.getMinutes()).padStart(2, '0')

  return `${day} ${month} ${year} at ${hour12}:${minute} ${period}`
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

  const diffDays = Math.round((endDateOnly - startDateOnly) / (24 * 60 * 60 * 1000)) + 1
  const computedTotalWeeks = Math.ceil(diffDays / 7)
  const totalWeeks = totalSessions ? parseInt(totalSessions) : computedTotalWeeks

  let sessionsCompleted = 0
  if (todayDate >= startDateOnly) {
    const daysElapsed = Math.round((todayDate - startDateOnly) / (24 * 60 * 60 * 1000))
    sessionsCompleted = Math.min(totalWeeks, Math.max(0, Math.floor(daysElapsed / 7) + 1))
  }

  const currentWeek = todayDate < startDateOnly ? 0 : sessionsCompleted
  const remainingSessions = Math.max(0, totalWeeks - sessionsCompleted)
  const percentage = totalWeeks === 0 ? 0 : Math.min(100, Math.round((sessionsCompleted / totalWeeks) * 100))

  let status = 'active'
  if (todayDate > endDateOnly) {
    status = 'archived'
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
    isOngoing: false,
    isCompleted: status === 'archived' || status === 'completed',
    isArchived: status === 'archived',
  }
}

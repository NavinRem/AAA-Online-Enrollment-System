import { isCancelled } from './statusHelper'

/**
 * Checks if a session is currently in progress.
 */
export const isSessionInProgress = (schedule, now = new Date()) => {
  if (!schedule?.day || !schedule?.timeslot) return false

  const daysLong = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const currentDayLong = daysLong[now.getDay()]
  const currentDayShort = daysShort[now.getDay()]
  
  if (schedule.day !== currentDayLong && schedule.day !== currentDayShort) return false

  const times = schedule.timeslot.split('-').map(t => t.trim())
  if (times.length !== 2) return false

  // Handle both 24h (10:30) and 12h (10:30 AM) formats
  const parseTimeToMinutes = (timeStr) => {
    const parts = timeStr.trim().split(/\s+/)
    const [hours, minutes] = parts[0].split(':').map(Number)
    let totalMinutes = hours * 60 + minutes
    
    if (parts.length > 1) {
      const modifier = parts[1].toUpperCase()
      if (modifier === 'PM' && hours < 12) totalMinutes += 12 * 60
      if (modifier === 'AM' && hours === 12) totalMinutes -= 12 * 60
    }
    return totalMinutes
  }

  const startMinutes = parseTimeToMinutes(times[0])
  const endMinutes = parseTimeToMinutes(times[1])
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes
}

/**
 * Calculates program-related statistics.
 */
export const calculateProgramStats = (programs = [], enrollments = [], sessions = [], now = new Date()) => {
  let activeCount = 0
  let upcomingCount = 0
  let inProgressCount = 0
  let archivedCount = 0

  programs.forEach(p => {
    const status = getProgramDisplayStatus(p, sessions, now)
    if (status === 'Active') activeCount++
    else if (status === 'Upcoming') upcomingCount++
    else if (status === 'In Progress') inProgressCount++
    else if (status === 'Archived') archivedCount++
  })

  return {
    total: programs.length,
    activeCount,
    upcomingCount,
    inProgressCount,
    archivedCount
  }
}

/**
 * Gets the display status for a program, overriding with 'In Progress' if a session is live.
 * Implements automated transitions for Upcoming, Active, In Progress, and Archived.
 */
export const getProgramDisplayStatus = (program, sessions = [], now = new Date()) => {
  if (!program) return 'Active'
  
  // 1. Explicitly Archived or manually closed
  if (program.status === 'Archived') return 'Archived'
  if (program.status === 'Closed') return 'Closed'

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  
  // Helper to parse date strings (YYYY-MM-DD)
  const parseDate = (d) => {
    if (!d) return null
    const date = new Date(d)
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  }

  const startDate = parseDate(program.startDate)
  const endDate = parseDate(program.endDate)

  // 2. Archive Check (Auto-Archive after 7 days)
  if (endDate) {
    const sevenDaysAfter = endDate + (7 * 24 * 60 * 60 * 1000)
    if (today > sevenDaysAfter) return 'Archived'
  }

  // 3. Upcoming Check
  if (startDate && today < startDate) {
    return 'Upcoming'
  }

  // 4. Active / In Progress Check
  if (startDate && endDate && today >= startDate && today <= endDate) {
    const hasLiveSession = sessions.some(s => 
      (s.courseId === program.id || s.course_id === program.id) && 
      isSessionInProgress(s.schedule, now)
    )

    // Fallback to program's own schedule
    const hasLiveSchedule = !hasLiveSession && isSessionInProgress(program.schedule, now)
    
    if (hasLiveSession || hasLiveSchedule) return 'In Progress'
    return 'Active'
  }

  // Fallback to existing status or default
  return program.status || 'Active'
}

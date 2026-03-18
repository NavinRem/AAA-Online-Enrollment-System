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
  // In Progress logic: find course IDs from sessions happening right now
  const inProgressProgramIds = new Set(
    sessions
      .filter(s => isSessionInProgress(s.schedule, now))
      .map(s => s.courseId || s.course_id)
  )

  return {
    total: programs.length,
    activeCount: programs.filter(p => (p.status || '').toLowerCase() === 'active').length,
    upcomingCount: programs.filter(p => (p.status || '').toLowerCase() === 'upcoming').length,
    inProgressCount: inProgressProgramIds.size
  }
}

/**
 * Gets the display status for a program, overriding with 'In Progress' if a session is live.
 */
export const getProgramDisplayStatus = (program, sessions = [], now = new Date()) => {
  const hasLiveSession = sessions.some(s => 
    (s.courseId === program.id || s.course_id === program.id) && 
    isSessionInProgress(s.schedule, now)
  )
  
  if (hasLiveSession) return 'In Progress'
  return program.status || 'Active'
}

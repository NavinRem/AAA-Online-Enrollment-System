import { isCancelled } from './statusHelper'

/**
 * Checks if a session is currently in progress.
 */
export const isSessionInProgress = (schedule, now = new Date()) => {
  if (!schedule?.day || !schedule?.timeslot) return false

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  if (schedule.day !== days[now.getDay()]) return false

  const times = schedule.timeslot.split('-').map(t => t.trim())
  if (times.length !== 2) return false

  const [startH, startM] = times[0].split(':').map(Number)
  const [endH, endM] = times[1].split(':').map(Number)
  
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  return currentMinutes >= (startH * 60 + startM) && currentMinutes <= (endH * 60 + endM)
}

/**
 * Calculates program-related statistics.
 */
export const calculateProgramStats = (programs = [], enrollments = [], sessions = [], now = new Date()) => {
  const activeProgramIds = new Set(enrollments.filter(r => !isCancelled(r.status || r.paymentStatus)).map(r => r.courseId))
  const inProgressProgramIds = new Set(sessions.filter(s => isSessionInProgress(s.schedule, now)).map(s => s.courseId))

  return {
    total: programs.length,
    activeCount: programs.filter(p => activeProgramIds.has(p.id)).length,
    upcomingCount: programs.filter(p => (p.status || '').toLowerCase() === 'upcoming').length,
    inProgressCount: inProgressProgramIds.size
  }
}

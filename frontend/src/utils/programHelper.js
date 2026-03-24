import { getImageUrl } from './assetHelper'

/**
 * Returns the appropriate icon path for a given program name.
 *
 * @param {string} programName
 */
export const getProgramIcon = (programName) => {
  // Maps program name to card asset
  if (!programName) return getImageUrl('programs/program')
  return getImageUrl(`classes/card-${programName.toLowerCase()}`)
}

export const getSessionCounts = (startDate, endDate, schedule) => {
  if (!startDate || !endDate || !schedule) return { total: 0, remaining: 0 }
  const start = new Date(startDate)
  const end = new Date(endDate)
  const today = new Date()

  if (today < start) return { total: 0, remaining: 0 }
  if (today > end) return { total: 0, remaining: 0 }

  const total = Math.floor((end - start) / (1000 * 60 * 60 * 24))
  const remaining = Math.floor((end - today) / (1000 * 60 * 60 * 24))

  return { total, remaining }
}

export const calculateProgramStats = (program) => {
  if (!program) return { total: 0, remaining: 0 }
  const { startDate, endDate, schedule } = program
  const { total, remaining } = getSessionCounts(startDate, endDate, schedule)
  return { total, remaining }
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


  

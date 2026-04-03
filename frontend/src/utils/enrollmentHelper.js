import { isPaid, isCancelled, isUnpaid } from './statusHelper'
import { isEnrollmentActive } from './studentStatusHelper'
import { parseDate } from './dateFormatter'
import { 
  getImageUrl, 
  getProgramProfileURL, 
  getParentProfileURL, 
  getStudentProfileURL,
  getTeacherProfileURL
} from '@/utils/assetHelper'

/**
 * Calculates enrollment statistics.
 */
export const calculateTotalEnrollment = (enrollments) => {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1

  const total = enrollments.length
  // Rule: Paid/Unpaid is controlled by paymentStatus, but exclude cancelled
  const paidCount = enrollments.filter(r => isPaid(r.paymentStatus) && !isCancelled(r.status)).length
  const unpaidCount = enrollments.filter(r => isUnpaid(r.paymentStatus) && !isCancelled(r.status)).length
  // Rule: Cancelled is controlled by Enrollment status
  const cancelledCount = enrollments.filter(r => isCancelled(r.status)).length
  const todayCount = enrollments.filter(r => {
    const time = parseDate(r.enrollAt || r.createdAt).getTime()
    return time >= startOfToday && time <= endOfToday
  }).length
  return {
    total,
    paidCount,
    unpaidCount,
    cancelledCount,
    todayCount,
  }
}

/**
 * Enriches enrollment data with parent/student info and icons.
 */
export const enrichEnrollments = (enrollments, parents = [], students = [], programs = [], sessions = []) => {
  return enrollments.map((r) => {
    const parent = r.parent || parents.find(p => (p.uid || p.id) === r.parentId)
    const student = r.student || students.find(s => (s.uid || s.id) === r.studentId)
    const program = r.program || programs.find(c => (c.id || c.uid) === r.programId)
    const sess = sessions.find(sess => sess.id === r.sessionId)

    const programCategory = r.programCategory || program?.category || 'program'
    const sessionSchedule = r.sessionSchedule || (sess?.schedule ? `${sess.schedule.day} ${sess.schedule.timeslot}` : 'N/A')

    return {
      ...r,
      parent: parent ? {
        id: parent.id || parent.uid,
        name: parent.name || parent.fullName || 'Parent',
        profile: parent.profile || parent.profileURL || null
      } : null,
      student: student ? {
        id: student.id || student.uid,
        name: student.name || student.fullName || 'Student',
        profile: student.profile || student.profileURL || null
      } : null,
      program: program ? {
        id: program.id || program.uid,
        title: program.title || program.name || 'Program',
        profile: program.profile || program.profileURL || null
      } : null,
      
      // Legacy compatibility for UI components not yet refactored
      parentName: parent?.name || parent?.fullName || r.parentName || 'N/A',
      parentProfileURL: getParentProfileURL(r.parentProfileURL || parent?.profile || parent?.profileURL),
      
      studentName: student?.name || student?.fullName || r.studentName || 'N/A',
      studentProfileURL: getStudentProfileURL(r.studentProfileURL || student?.profile || student?.profileURL),
      
      programTitle: program?.title || program?.name || r.programTitle || 'N/A',
      programProfileURL: getProgramProfileURL(r.programProfileURL || program?.profile || program?.profileURL, programCategory),
      
      sessionSchedule,

      teacherName: r.teacherName || (program?.teachers?.length > 0 ? program.teachers[0].name : ''),
      teacherProfileURL: getTeacherProfileURL(r.teacherProfileURL || (program?.teachers?.length > 0 ? program.teachers[0].profileURL : null)),
      
      // Rule: Display is based on Enrollment Status (Cancelled wins) or Payment Status (Paid/Unpaid)
      displayStatus: r.displayStatus || (isCancelled(r.status) ? 'Cancelled' : (isPaid(r.paymentStatus) ? 'Paid' : 'Unpaid')),
      academicStatus: getAcademicStatus(r)
    }
  }).sort((a, b) => new Date(b.enrollAt || b.createdAt) - new Date(a.enrollAt || a.createdAt))
}

/**
 * Determines the academic status of an enrollment.
 */
export const getAcademicStatus = (r) => {
  if (r.academicStatus) return r.academicStatus
  
  const status = (r.status || '').toLowerCase()
  const paymentStatus = (r.paymentStatus || '').toLowerCase()

  // Terminal statuses
  if (isCancelled(r.status || r.paymentStatus)) return 'Stopped'
  if (status === 'suspended') return 'Suspended'
  
  const endDate = r.endDate ? new Date(r.endDate) : null
  if (isPaid(r.status || r.paymentStatus) && endDate && new Date() > endDate) return 'Graduated'

  // Progress statuses
  if (isUnpaid(paymentStatus || status)) return 'Unpaid'
  if (isPaid(paymentStatus || status) || isEnrollmentActive(r)) return 'Studying'
  
  return 'Inactive'
}

/**
 * Filters enrollments for parent/student detail views.
 */
export const filterDetailEnrollments = (enrollments, options = {}) => {
  const { studentId, status, paymentStatus, academicStatus } = options
  let list = enrollments

  if (studentId && studentId !== 'all') {
    list = list.filter(r => r.studentId === studentId)
  }

  if (status && status !== 'all') {
    list = list.filter(r => (r.status || '').toLowerCase() === status.toLowerCase())
  }

  if (paymentStatus && paymentStatus !== 'all') {
    list = list.filter(r => {
      const s = (r.paymentStatus || r.status || '').toLowerCase()
      if (paymentStatus === 'paid') return isPaid(s)
      if (paymentStatus === 'pending') return s === 'pending'
      if (paymentStatus === 'cancelled') return isCancelled(s)
      return true
    })
  }

  if (academicStatus && academicStatus !== 'all') {
    list = list.filter(r => getAcademicStatus(r).toLowerCase() === academicStatus.toLowerCase())
  }

  return list
}

/**
 * Cleans the session schedule string for display.
 */
export const cleanSessionSchedule = (schedule) => {
  if (!schedule) return 'N/A'
  return schedule.replace(/day:|timeslot:/gi, '').replace(/,/g, '').trim()
}

/**
 * Gets the display status of an enrollment.
 */
export const getEnrollmentDisplayStatus = (r) => {
  if (!r) return 'Unpaid'
  return r.displayStatus || (isCancelled(r.status || r.paymentStatus) ? 'Cancelled' : (isPaid(r.status || r.paymentStatus) ? 'Paid' : 'Unpaid'))
}

/**
 * Gets the display mode of an enrollment (Full, Partial, Trial).
 */
export const getEnrollmentDisplayMode = (r) => {
  if (!r) return 'Full'
  if (r.isProrated) return 'Partial'
  return r.enrollmentType || 'Full'
}

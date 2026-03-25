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
  const paidCount = enrollments.filter(r => isPaid(r.status || r.paymentStatus)).length
  const unpaidCount = enrollments.filter(r => isUnpaid(r.status || r.paymentStatus)).length
  const cancelledCount = enrollments.filter(r => isCancelled(r.status || r.paymentStatus)).length
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
export const enrichEnrollments = (enrollments, parents = [], students = [], programs = []) => {
  return enrollments.map((r) => {
    const p = parents.find(p => (p.uid || p.id) === r.parentId)
    const s = students.find(s => (s.uid || s.id) === r.studentId)
    const c = programs.find(c => (c.id || c.uid) === r.programId)

    const programCategory = r.programCategory || c?.category || 'program'

    return {
      ...r,
      parentName: r.parentName || p?.fullName || p?.name || 'N/A',
      parentProfileURL: getParentProfileURL(r.parentProfileURL || p?.profileURL),
      
      studentName: r.studentName || s?.fullName || s?.name || 'N/A',
      studentProfileURL: getStudentProfileURL(r.studentProfileURL || s?.profileURL),
      
      programTitle: r.programTitle || c?.title || 'N/A',
      programProfileURL: getProgramProfileURL(r.programProfileURL || c?.profileURL, programCategory),
      
      teacherName: r.teacherName || (c?.teachers?.length > 0 ? c.teachers[0].name : ''),
      teacherProfileURL: getTeacherProfileURL(r.teacherProfileURL || (c?.teachers?.length > 0 ? c.teachers[0].profileURL : null)),
      
      displayStatus: r.displayStatus || (isCancelled(r.status || r.paymentStatus) ? 'Cancelled' : (isPaid(r.status || r.paymentStatus) ? 'Paid' : 'Unpaid')),
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

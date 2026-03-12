import { getCourseIcon } from './courseHelper'
import { isPaid, isCancelled, isUnpaid } from './statusHelper'
import { isEnrollmentActive } from './studentStatusHelper'

/**
 * Calculates enrollment statistics.
 */
export const calculateEnrollmentStats = (enrollments) => {
  const now = new Date().toISOString().split('T')[0] // Safe: toISOString() always contains 'T'
  const today = enrollments.filter(r => (r.enrollAt || r.createdAt)?.startsWith(now))
  
  return {
    total: enrollments.length,
    todayCount: today.length,
    pendingCount: enrollments.filter(r => [r.status, r.paymentStatus].includes('pending')).length,
    todayRevenue: today.filter(r => isPaid(r.status || r.paymentStatus)).reduce((sum, r) => sum + (r.amount || 0), 0)
  }
}

/**
 * Enriches enrollment data with parent/student info and icons.
 */
export const enrichEnrollments = (enrollments, parents = [], students = []) => {
  return enrollments.map((r) => {
    const p = parents.find(p => (p.uid || p.id) === r.parentId)
    const s = students.find(s => (s.uid || s.id) === r.studentId)

    return {
      ...r,
      parentProfileURL: p?.profileURL || null,
      studentProfileURL: s?.profileURL || null,
      courseIcon: getCourseIcon(r.courseTitle || r.course_title),
      displayStatus: isPaid(r.status || r.paymentStatus) ? 'Paid' : (isCancelled(r.status || r.paymentStatus) ? 'Cancelled' : 'Unpaid'),
      academicStatus: getAcademicStatus(r)
    }
  }).sort((a, b) => new Date(b.enrollAt || b.createdAt) - new Date(a.enrollAt || a.createdAt))
}

/**
 * Determines the academic status of an enrollment.
 */
export const getAcademicStatus = (r) => {
  if (r.academicStatus) return r.academicStatus
  if (isEnrollmentActive(r)) return 'Studying'
  if (isCancelled(r.status || r.paymentStatus)) return 'Stopped'
  if ((r.status || '').toLowerCase() === 'suspended') return 'Suspended'
  
  const endDate = r.endDate ? new Date(r.endDate) : null
  if (isPaid(r.status || r.paymentStatus) && endDate && new Date() > endDate) return 'Graduated'
  
  return 'Inactive'
}

/**
 * Filters enrollments for parent/student detail views.
 */
export const filterDetailEnrollments = (enrollments, options = {}) => {
  const { studentId, status, paymentStatus, academicStatus } = options
  let list = enrollments

  if (studentId && studentId !== 'all') {
    list = list.filter(r => (r.studentId || r.student_id) === studentId)
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

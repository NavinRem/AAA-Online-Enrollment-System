import { calculateStudentStatus, isEnrollmentActive } from './studentStatusHelper'

/**
 * Enriches student data for the list view.
 */
export const enrichStudents = (students = [], enrollments = [], users = []) => {
  return students.map(s => {
    const id = String(s.id || s.uid || '')
    const regs = enrollments.filter(r => String(r.student_id || r.studentId || '') === id)
    const p = users.find(u => String(u.uid || u.id || '') === String(s.parentId || s.parent_id || ''))

    return {
      ...s,
      id,
      status: calculateStudentStatus(s, regs),
      programs: regs.filter(isEnrollmentActive),
      parentProfileURL: p?.profileURL || null,
      dob: s.dob || s.DoB,
      fullName: s.fullname || s.name || s.fullName
    }
  })
}

/**
 * Calculates student statistics.
 */
export const calculateStudentStats = (students) => {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  return {
    total: students.length,
    activeCount: students.filter(s => s.status?.toLowerCase() === 'studying').length,
    newThisWeekCount: students.filter(s => new Date(s.createdAt || s.created_at).getTime() >= weekAgo).length,
    pendingPaymentCount: students.filter(s => s.paymentStatus?.toLowerCase() === 'pending').length
  }
}

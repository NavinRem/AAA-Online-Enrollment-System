import { calculateStudentStatus, isEnrollmentActive } from './studentStatusHelper'

/**
 * Enriches student data for the list view.
 */
export const enrichStudents = (students = [], enrollments = [], users = []) => {
  return students.map(s => {
    const id = String(s.id || s.uid || '')
    const regs = enrollments.filter(r => String(r.studentId || '') === id)
    const p = users.find(u => String(u.uid || u.id || '') === String(s.parentId || ''))

    return {
      ...s,
      id,
      status: calculateStudentStatus(s, regs),
      programs: regs.filter(isEnrollmentActive),
      parentProfileURL: p?.profileURL || null,
      dob: s.dob || s.DoB,
      fullName: s.fullName || s.fullname || s.name || 'Student',
    }
  })
}

/**
 * Calculates student statistics.
 */
export const calculateTotalStudent = (students) => {
  const totalStudent = students.length
  const currentlyEnrolled = students.filter(s => String(s.status || '').toLowerCase() === 'studying').length
  const notCurrentlyEnrolled = students.filter(s => String(s.status || '').toLowerCase() !== 'studying').length
  const stopEnrolled = students.filter(s => String(s.status || '').toLowerCase() === 'stopped').length
  const graduated = students.filter(s => String(s.status || '').toLowerCase() === 'graduated').length

  return {
    totalStudent,
    currentlyEnrolled,
    notCurrentlyEnrolled,
    stopEnrolled,
    graduated
  }
}

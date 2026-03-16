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
      fullName: s.fullname || s.name || s.fullName || s.fullName,
      fullname: s.fullname || s.name || s.fullName || s.fullName
    }
  })
}

/**
 * Calculates student statistics.
 */
export const calculateTotalStudent = (students) => {
  const totalStudent = students.length
  const currently_enrolled = students.filter(s => String(s.status || '').toLowerCase() === 'studying').length
  const not_currently_enrolled = students.filter(s => String(s.status || '').toLowerCase() !== 'studying').length
  const newly_enrolled = students.filter(s => String(s.status || '').toLowerCase() === 'inactive').length
  return {
    totalStudent,
    currently_enrolled,
    not_currently_enrolled,
    newly_enrolled
  }
}

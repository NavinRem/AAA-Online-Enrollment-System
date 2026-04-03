import { calculateStudentStatus, isEnrollmentActive } from './studentStatusHelper'

/**
 * Enriches student data for the list view.
 */
export const enrichStudents = (students = [], enrollments = [], users = []) => {
  return students.map(student => {
    const s = { ...student }
    const id = String(s.id || s.uid || '')
    const regs = enrollments.filter(r => String(r.studentId || '') === id)
    
    // Resolve Parent Info if missing or for enrichment
    const parentId = s.parentId || (s.parentInfo && s.parentInfo.id)
    const p = users.find(u => String(u.uid || u.id || '') === String(parentId || ''))
    
    // Standardize Name & Profile
    const name = s.name || s.fullName || s.fullname || 'Student'
    const profile = s.profile || s.profileURL || s.childProfileURL || null
    
    // Robust Parent Snapshot
    const parentInfo = s.parentInfo || (p ? {
      id: p.uid || p.id,
      name: p.name || p.email || 'Parent',
      email: p.email || 'N/A',
      phone: p.phone || 'N/A',
      role: p.role || 'guardian',
      profile: p.profile || p.profileURL || null
    } : null)

    return {
      ...s,
      id,
      name,
      profile,
      parentInfo,
      status: calculateStudentStatus(s, regs),
      programs: regs.filter(isEnrollmentActive),
      dob: s.dob || s.DoB,
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

import { calculateStudentStatus, isEnrollmentActive } from './statusUtils'

/**
 * Enriches student data for the list view.
 */
export const enrichStudents = (students = [], enrollments = [], users = []) => {
  return students.map((s) => {
    const id = String(s.id || s.uid || '')
    const regs = enrollments.filter((r) => String(r.studentId || '') === id)
    const p = users.find((u) => String(u.uid || u.id || '') === String(s.parentId || ''))

    return {
      ...s,
      id,
      name: s.name,
      profileURL: s.profileURL,
      parentInfo:
        s.parentInfo ||
        (p
          ? {
              id: p.uid || p.id,
              name: p.name,
              email: p.email,
              phone: p.phone,
              role: p.role,
              profileURL: p.profileURL,
            }
          : null),
      status: calculateStudentStatus(s, regs),
      activePrograms: regs.filter(isEnrollmentActive),
    }
  })
}

/**
 * Calculates student statistics.
 */
export const calculateTotalStudent = (students) => ({
  total: students.length,
  studying: students.filter((s) => s.status === 'Studying').length,
  inactive: students.filter((s) => s.status === 'Inactive').length,
  graduated: students.filter((s) => s.status === 'Graduated').length,
})

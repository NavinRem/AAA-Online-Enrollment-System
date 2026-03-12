import { isPaid, isCancelled } from './statusHelper'

/**
 * Checks if a specific enrollment should be considered "Active/Studying".
 */
export const isEnrollmentActive = (reg) => {
  if (!reg) return false
  if (isCancelled(reg.status || reg.paymentStatus)) return false
  if (!isPaid(reg.status || reg.paymentStatus)) return false

  const now = new Date()
  const endDate = reg.endDate ? new Date(reg.endDate) : null
  return !endDate || endDate >= now
}

/**
 * Calculates a student's true status based on their explicit override state and history.
 */
export const calculateStudentStatus = (student, allEnrollments = []) => {
  const explicitStatuses = ['Suspended', 'Stopped']
  if (student.status && explicitStatuses.includes(student.status)) {
    return student.status
  }

  const studentId = String(student.id || student.uid || '')
  if (!studentId) return 'Inactive'
  
  const studentRegs = allEnrollments.filter(r => String(r.student_id || r.studentId || '') === studentId)
  if (studentRegs.length === 0) return 'Inactive'

  let hasValidPaidEnrollment = false
  let isActivelyStudying = false
  let hasCancelledEnrollment = false

  for (const reg of studentRegs) {
    if (isEnrollmentActive(reg)) {
      isActivelyStudying = true
      hasValidPaidEnrollment = true
      continue
    }

    if (isCancelled(reg.status || reg.paymentStatus)) {
      hasCancelledEnrollment = true
    } else if (isPaid(reg.status || reg.paymentStatus)) {
      hasValidPaidEnrollment = true
    }
  }

  if (isActivelyStudying) return 'Studying'
  if (hasValidPaidEnrollment) return 'Graduated'
  if (hasCancelledEnrollment) return 'Stopped'
  return 'Inactive'
}

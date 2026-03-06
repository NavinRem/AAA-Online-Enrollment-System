/**
 * Checks if a specific enrollment should be considered "Active/Studying".
 * @param {Object} reg - The registration/enrollment object
 * @returns {Boolean}
 */
export const isEnrollmentActive = (reg) => {
  if (!reg) return false
  const regStatus = (reg.status || '').toLowerCase()
  const payStatus = (reg.paymentStatus || '').toLowerCase()

  // If explicitly cancelled, it's not active
  if (['cancelled', 'canceled'].includes(regStatus)) return false

  // Enrollment is active if:
  // 1. It is marked as confirmed/paid/active/success
  // 2. OR it is explicitly marked as 'paid' in the paymentStatus field
  const isValid =
    ['confirmed', 'paid', 'active', 'success'].includes(regStatus) || payStatus === 'paid'

  if (!isValid) return false

  const now = new Date()
  const endDate = reg.endDate ? new Date(reg.endDate) : null

  // If there is no specific end date, or the end date is in the future, it is active
  return !endDate || endDate >= now
}

/**
 * Calculates a student's true status based on their explicit override state and their enrollment history.
 *
 * Hierarchy:
 * 1. Admin Overrides (Suspended, Stopped) take precedence.
 * 2. Active, ongoing paid/confirmed enrollments -> 'Studying'
 * 3. Paid/confirmed enrollments that all ended -> 'Graduated'
 * 4. No valid, paid enrollments ever -> 'Inactive'
 *
 * @param {Object} student - The student object
 * @param {Array} allRegistrations - Array of all enrollments
 * @returns {String} The calculated status
 */
export const calculateStudentStatus = (student, allRegistrations = []) => {
  // 1. Explicit admin overrides take precedence over everything
  const explicitStatuses = ['Suspended', 'Stopped']
  if (student.status && explicitStatuses.includes(student.status)) {
    return student.status
  }

  // Get only this student's registrations
  const studentId = student.id || student.uid
  if (!studentId) return 'Inactive'

  const studentRegs = allRegistrations.filter(
    (r) => r.student_id === studentId || r.studentId === studentId,
  )

  if (studentRegs.length === 0) {
    return 'Inactive'
  }

  const now = new Date()
  let hasValidPaidEnrollment = false
  let isActivelyStudying = false
  let hasCancelledEnrollment = false

  for (const reg of studentRegs) {
    if (isEnrollmentActive(reg)) {
      isActivelyStudying = true
      hasValidPaidEnrollment = true
      continue
    }

    const regStatus = (reg.status || '').toLowerCase()
    const payStatus = (reg.paymentStatus || '').toLowerCase()

    if (['cancelled', 'canceled'].includes(regStatus)) {
      hasCancelledEnrollment = true
    } else {
      // Even if not "active" (e.g. ended), it was still a valid paid enrollment in the past
      const isPaid =
        ['confirmed', 'paid', 'active', 'success'].includes(regStatus) || payStatus === 'paid'
      if (isPaid) hasValidPaidEnrollment = true
    }
  }

  // If they have an active ongoing enrollment
  if (isActivelyStudying) {
    return 'Studying'
  }

  // If they have paid enrollments, but all of them have ended in the past
  if (hasValidPaidEnrollment) {
    return 'Graduated'
  }

  // If they have no valid paid enrollments, but they have cancelled ones
  if (hasCancelledEnrollment) {
    return 'Stopped'
  }

  // If they have no valid paid enrollments at all (maybe pending unpaid ones)
  // Or they just registered and haven't enrolled yet
  return 'Inactive'
}

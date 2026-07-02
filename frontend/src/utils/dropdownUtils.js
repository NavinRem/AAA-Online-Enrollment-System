/**
 * Filter programs that have already been selected in the term or the class catalog.
 * @param {Array} programs - The list of programs to filter.
 * @param {Object} context - The context object (can be null for global operations).
 * @param {String} type - The modal type ('add', 'edit', etc).
 * @param {Array} existingClasses - The list of existing global classes (dataStore.classes).
 * @returns {Array} - The filtered list of programs.
 */
export const filterDuplicatePrograms = (programs, context, type, existingClasses) => {
  let list = [...programs]

  if (context && type === 'add') {
    let existingProgramIds = []
    
    if (context.existingOfferings) {
      existingProgramIds = context.existingOfferings.map((o) => o.programId || o.program?.id)
    } else if (context.offeringIds) {
      existingProgramIds = context.offeringIds
    }
    
    const validProgramIds = existingProgramIds.filter(Boolean).map(String)
    
    if (validProgramIds.length > 0) {
      list = list.filter((p) => !validProgramIds.includes(String(p.id)))
    }
  } else if (!context && type === 'add') {
    const existingClassProgramIds = existingClasses.map((c) => c.programId || c.program?.id)
    const validProgramIds = existingClassProgramIds.filter(Boolean).map(String)
    
    if (validProgramIds.length > 0) {
      list = list.filter((p) => !validProgramIds.includes(String(p.id)))
    }
  }

  return list
}

/**
 * Filter classes and their schedules, removing the ones already added to the term.
 * @param {Array} classes - The full list of classes from the store.
 * @param {String} programId - The selected program ID to filter classes by.
 * @param {Array} existingOfferings - The array of existing offerings in the term.
 * @returns {Array} - The flattened list of available schedules/classes.
 */
export const filterDuplicateClasses = (classes, programId, existingOfferings) => {
  if (!programId) return []
  
  const matches = classes.filter(
    (c) =>
      String(c.programId) === String(programId) ||
      String(c.program?.id) === String(programId),
  )

  const flattened = []
  matches.forEach((c) => {
    if (c.schedules && c.schedules.length > 0) {
      c.schedules.forEach((s) => {
        const isAlreadyAdded = existingOfferings?.some(
          (o) => String(o.classId) === String(c.id) && String(o.scheduleId) === String(s.id),
        )
        if (isAlreadyAdded) return
        
        flattened.push({
          ...c,
          id: `${c.id}_${s.id}`, // Unique ID for AppSelect
          originalClassId: c.id,
          displaySchedule: s,
        })
      })
    } else {
      flattened.push({
        ...c,
        id: `${c.id}_none`,
        originalClassId: c.id,
        displaySchedule: null,
      })
    }
  })

  return flattened
}

/**
 * Filter out programs that the student is already enrolled in to prevent duplicate enrollments.
 * @param {Array} programs - The list of programs available to select.
 * @param {String} studentId - The ID of the student.
 * @param {Array} allEnrollments - The global list of enrollments (or student's enrollments).
 * @param {String} excludeEnrollmentId - The ID of the enrollment currently being edited (so it isn't filtered out).
 * @returns {Array} - The filtered list of programs.
 */
export const filterEnrolledPrograms = (programs, studentId, allEnrollments = [], excludeEnrollmentId = null) => {
  if (!studentId) return []
  
  const activeStatuses = ['paid', 'unpaid', 'active', 'confirmed', 'success', 'pending', 'partial']
  const studentEnrollments = allEnrollments.filter(
    (e) =>
      String(e.studentId) === String(studentId) &&
      activeStatuses.includes(String(e.status || '').toLowerCase().trim()) &&
      e.isDeleted !== true &&
      String(e.id) !== String(excludeEnrollmentId)
  )
  const enrolledProgramIds = new Set(studentEnrollments.map((e) => String(e.programId)))

  return programs.filter((p) => !enrolledProgramIds.has(String(p.id)))
}

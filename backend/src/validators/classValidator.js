function validateClass(classData) {
  const classFields = [
    'programId',
    'branchId',
    'termId',
    'teacherId',
    'schedules',
    'scheduleType',
    'status',
    'adminNote',
    'maxCapacity',
    'enrolledCount',
    'program',
    'term',
    'branch',
    'teacher',
  ]

  Object.keys(classData).forEach((key) => {
    if (!classFields.includes(key)) {
      throw new Error(`Invalid field: ${key}`)
    }
  })

  const { programId, termId, branchId, teacherId } = classData

  if (!programId || !termId || !branchId || !teacherId) {
    throw new Error('Program, Term, Branch, and Teacher IDs are required')
  }

  return {
    programId,
    termId,
    branchId,
    teacherId,
    schedules: classData.schedules || [],
    scheduleType: classData.scheduleType || 'group',
    adminNote: classData.adminNote || '',
    maxCapacity: parseInt(classData.maxCapacity || 0),
    enrolledCount: parseInt(classData.enrolledCount || 0),
    status: classData.status || 'open',
    program: classData.program || null,
    term: classData.term || null,
    branch: classData.branch || null,
    teacher: classData.teacher || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function validateUpdateClass(updateData) {
  const allowedFields = [
    'programId',
    'termId',
    'branchId',
    'teacherId',
    'schedules',
    'scheduleType',
    'status',
    'adminNote',
    'maxCapacity',
    'enrolledCount',
    'program',
    'term',
    'branch',
    'teacher',
  ]
  const cleanData = {}

  Object.keys(updateData).forEach((key) => {
    if (!allowedFields.includes(key)) {
      throw new Error(`Invalid field: ${key}`)
    }
  })

  if (updateData.programId !== undefined)
    cleanData.programId = updateData.programId
  if (updateData.termId !== undefined) cleanData.termId = updateData.termId
  if (updateData.branchId !== undefined)
    cleanData.branchId = updateData.branchId
  if (updateData.teacherId !== undefined)
    cleanData.teacherId = updateData.teacherId

  if (updateData.schedules !== undefined)
    cleanData.schedules = updateData.schedules
  if (updateData.scheduleType !== undefined)
    cleanData.scheduleType = updateData.scheduleType
  if (updateData.status !== undefined) cleanData.status = updateData.status
  if (updateData.adminNote !== undefined)
    cleanData.adminNote = updateData.adminNote
  if (updateData.maxCapacity !== undefined)
    cleanData.maxCapacity = parseInt(updateData.maxCapacity || 0)
  if (updateData.enrolledCount !== undefined)
    cleanData.enrolledCount = parseInt(updateData.enrolledCount || 0)

  // Standard snapshots
  if (updateData.program !== undefined) cleanData.program = updateData.program
  if (updateData.term !== undefined) cleanData.term = updateData.term
  if (updateData.branch !== undefined) cleanData.branch = updateData.branch
  if (updateData.teacher !== undefined) cleanData.teacher = updateData.teacher

  if (Object.keys(cleanData).length === 0) {
    throw new Error('No valid fields provided for update')
  }

  cleanData.updatedAt = new Date().toISOString()
  return cleanData
}

module.exports = { validateClass, validateUpdateClass }

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

  const rawSchedules = Array.isArray(classData.schedules)
    ? classData.schedules
    : []
  const schedules = rawSchedules.map((s) => ({
    day: s.day || '',
    time: s.time || s.timeslot || '',
  }))

  return {
    programId,
    termId,
    branchId,
    teacherId,
    schedules,
    scheduleType: classData.scheduleType || 'group',
    adminNote: classData.adminNote || '',
    maxCapacity: parseInt(classData.maxCapacity || 0),
    enrolledCount: parseInt(classData.enrolledCount || 0),
    status: classData.status || 'open',
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
  ]
  const cleanData = {}

  Object.keys(updateData).forEach((key) => {
    if (allowedFields.includes(key)) {
      cleanData[key] = updateData[key]
    }
  })

  if (Object.keys(cleanData).length === 0) {
    throw new Error('No valid fields provided for update')
  }

  if (cleanData.schedules !== undefined) {
    const rawSchedules = Array.isArray(cleanData.schedules)
      ? cleanData.schedules
      : []
    cleanData.schedules = rawSchedules.map((s) => ({
      day: s.day || '',
      time: s.time || s.timeslot || '',
    }))
  }

  if (cleanData.maxCapacity !== undefined)
    cleanData.maxCapacity = parseInt(cleanData.maxCapacity || 0)
  if (cleanData.enrolledCount !== undefined)
    cleanData.enrolledCount = parseInt(cleanData.enrolledCount || 0)

  cleanData.updatedAt = new Date().toISOString()
  return cleanData
}

module.exports = { validateClass, validateUpdateClass }

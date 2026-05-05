function validateClass(classData) {
  const classFields = [
    'programId',
    'branchId',
    'branchIds',
    'termId',
    'teacherIds',
    'schedule',
    'scheduleType',
    'status',
    'adminNote',
    'capacity',
    'currentCount',
  ]

  Object.keys(classData).forEach((key) => {
    if (!classFields.includes(key)) {
      throw new Error(`Invalid field: ${key}`)
    }
  })

  const { programId, termId, teacherIds, schedule } = classData
  const branchIds =
    classData.branchIds || (classData.branchId ? [classData.branchId] : [])

  if (
    !programId ||
    !termId ||
    !branchIds.length ||
    !teacherIds ||
    !teacherIds.length
  ) {
    throw new Error(
      'Program, Term, Branch (at least one), and at least one Teacher are required',
    )
  }

  if (!schedule || !schedule.day || !schedule.time) {
    throw new Error('A valid schedule (day and time) is required')
  }

  return {
    programId,
    termId,
    branchIds,
    teacherIds,
    schedule: {
      day: schedule.day,
      time: schedule.time,
    },
    scheduleType: classData.scheduleType || 'fixed',
    adminNote: classData.adminNote || '',
    capacity: parseInt(classData.capacity || classData.maxCapacity || 0),
    currentCount: parseInt(classData.currentCount || classData.enrolledCount || 0),
    status: String(classData.status || 'active').toLowerCase(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function validateUpdateClass(updateData) {
  const allowedFields = [
    'programId',
    'termId',
    'branchId',
    'branchIds',
    'teacherIds',
    'schedule',
    'scheduleType',
    'status',
    'adminNote',
    'capacity',
    'currentCount',
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

  if (cleanData.schedule) {
    if (!cleanData.schedule.day || !cleanData.schedule.time) {
      throw new Error('Schedule must contain both day and time')
    }
  }

  if (cleanData.capacity !== undefined)
    cleanData.capacity = parseInt(cleanData.capacity || 0)
  if (cleanData.currentCount !== undefined)
    cleanData.currentCount = parseInt(cleanData.currentCount || 0)

  if (cleanData.status !== undefined)
    cleanData.status = String(cleanData.status).toLowerCase()

  cleanData.updatedAt = new Date().toISOString()
  return cleanData
}

module.exports = { validateClass, validateUpdateClass }

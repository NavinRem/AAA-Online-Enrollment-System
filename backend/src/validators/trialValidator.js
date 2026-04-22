function validateTrial(trialData) {
  const trialFields = [
    'studentId',
    'parentId',
    'classId',
    'programId',
    'trialDate',
    'status',
    'remark',
    'isGuest',
    'guestParentName',
    'guestStudentName',
    'guestPhone',
    'guestStudentAge',
  ]

  Object.keys(trialData).forEach((key) => {
    if (!trialFields.includes(key)) {
      throw new Error(`Invalid field: ${key}`)
    }
  })

  if (!trialData.classId || !trialData.programId) {
    throw new Error('classId and programId are required')
  }

  if (!trialData.isGuest && !trialData.studentId) {
    throw new Error('studentId is required for registered students')
  }

  if (
    trialData.isGuest &&
    (!trialData.guestParentName || !trialData.guestStudentName)
  ) {
    throw new Error(
      'Guest Parent Name and Student Name are required for walk-ins',
    )
  }

  return {
    isGuest: !!trialData.isGuest,
    studentId: trialData.studentId || null,
    parentId: trialData.parentId || null,
    classId: trialData.classId,
    programId: trialData.programId,

    guestParentName: trialData.guestParentName?.trim() || null,
    guestStudentName: trialData.guestStudentName?.trim() || null,
    guestPhone: trialData.guestPhone?.trim() || null,
    guestStudentAge: parseInt(trialData.guestStudentAge || 0),

    trialDate: trialData.trialDate || new Date().toISOString(),
    status: trialData.status || 'pending',
    remark: trialData.remark || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function validateUpdateTrial(updateData) {
  const allowedFields = [
    'studentId',
    'classId',
    'programId',
    'trialDate',
    'status',
    'remark',
    'parentId',
    'isGuest',
    'guestParentName',
    'guestStudentName',
    'guestPhone',
    'guestStudentAge',
  ]
  const cleanData = {}

  Object.keys(updateData).forEach((key) => {
    if (allowedFields.includes(key)) {
      cleanData[key] = updateData[key]
    } else {
      throw new Error(`Invalid field: ${key}`)
    }
  })

  if (cleanData.guestStudentAge !== undefined)
    cleanData.guestStudentAge = parseInt(cleanData.guestStudentAge || 0)

  if (Object.keys(cleanData).length === 0) {
    throw new Error('No valid fields provided for update')
  }

  cleanData.updatedAt = new Date().toISOString()
  return cleanData
}

module.exports = { validateTrial, validateUpdateTrial }

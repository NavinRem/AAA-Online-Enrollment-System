function getUpcomingWeekendStr(dateStr) {
  if (!dateStr) {
    const d = new Date()
    dateStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0]
  }
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return new Date().toISOString()
  const day = d.getUTCDay()
  if (day >= 1 && day <= 5) {
    d.setUTCDate(d.getUTCDate() + (6 - day))
  }
  return d.toISOString().split('T')[0]
}

function validateTrial(trialData) {
  const trialFields = [
    'studentId',
    'parentId',
    'classId',
    'programId',
    'branchId',
    'trialDate',
    'trialTime',
    'status',
    'remark',
    'isGuest',
    'guestParentName',
    'guestParentEmail',
    'guestParentPhone',
    'guestParentAvatar',
    'guestStudentName',
    'guestStudentDOB',
    'guestStudentAge',
    'guestStudentAvatar',
    'trialType',
    'isSuccessful',
  ]

  Object.keys(trialData).forEach((key) => {
    if (!trialFields.includes(key)) {
      throw new Error(`Invalid field: ${key}`)
    }
  })

  if (!trialData.programId) {
    throw new Error('programId is required')
  }

  if (!trialData.classId && !trialData.branchId) {
    throw new Error('Either classId or branchId is required')
  }

  if (!trialData.isGuest && !trialData.studentId) {
    throw new Error('studentId is required for registered students')
  }

  if (
    trialData.isGuest &&
    (!trialData.guestParentName ||
      !trialData.guestStudentName ||
      !trialData.guestParentPhone)
  ) {
    throw new Error(
      'Guest Parent Name, Phone, and Student Name are required for walk-ins',
    )
  }

  return {
    isGuest: !!trialData.isGuest,
    studentId: trialData.studentId || null,
    parentId: trialData.parentId || null,
    classId: trialData.classId || null,
    programId: trialData.programId,
    branchId: trialData.branchId || null,

    guestParentName: trialData.guestParentName?.trim() || null,
    guestParentEmail: trialData.guestParentEmail?.trim() || null,
    guestParentPhone: trialData.guestParentPhone?.trim() || null,
    guestParentAvatar: trialData.guestParentAvatar?.trim() || null,

    guestStudentName: trialData.guestStudentName?.trim() || null,
    guestStudentDOB: trialData.guestStudentDOB || null,
    guestStudentAge: parseInt(trialData.guestStudentAge || 0),
    guestStudentAvatar: trialData.guestStudentAvatar?.trim() || null,

    trialDate: getUpcomingWeekendStr(trialData.trialDate),
    trialTime: trialData.trialTime || null,
    status: trialData.status || 'confirmed',
    trialType:
      trialData.trialType || (trialData.isGuest ? 'walk-in' : 'booked'),
    isSuccessful: !!trialData.isSuccessful,
    remark: trialData.remark || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function validateUpdateTrial(updateData) {
  const allowedFields = [
    'studentId',
    'parentId',
    'classId',
    'programId',
    'branchId',
    'trialDate',
    'trialTime',
    'status',
    'remark',
    'isGuest',
    'guestParentName',
    'guestParentEmail',
    'guestParentPhone',
    'guestParentAvatar',
    'guestStudentName',
    'guestStudentDOB',
    'guestStudentAge',
    'guestStudentAvatar',
    'trialType',
    'isSuccessful',
  ]
  const cleanData = {}

  Object.keys(updateData).forEach((key) => {
    if (allowedFields.includes(key)) {
      if (key === 'trialDate') {
        cleanData[key] = getUpcomingWeekendStr(updateData[key])
      } else {
        cleanData[key] = updateData[key]
      }
    } else {
      throw new Error(`Invalid field: ${key}`)
    }
  })

  if (cleanData.guestStudentAge !== undefined)
    cleanData.guestStudentAge = parseInt(cleanData.guestStudentAge)

  if (Object.keys(cleanData).length === 0) {
    throw new Error('No valid fields provided for update')
  }

  cleanData.updatedAt = new Date().toISOString()
  return cleanData
}

module.exports = { validateTrial, validateUpdateTrial }

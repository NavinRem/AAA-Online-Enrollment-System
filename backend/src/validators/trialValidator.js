function validateTrial(trialData) {
  const trialFields = [
    'studentId',
    'parentId',
    'classId',
    'trialDate',
    'status',
    'remark',
  ]

  Object.keys(trialData).forEach((key) => {
    if (!trialFields.includes(key)) {
      throw new Error(`Invalid field: ${key}`)
    }
  })

  if (!trialData.studentId || !trialData.classId) {
    throw new Error('studentId and classId are required')
  }

  return {
    studentId: trialData.studentId,
    classId: trialData.classId,
    parentId: trialData.parentId,
    trialDate: trialData.trialDate,
    status: trialData.status,
    remark: trialData.remark,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function validateUpdateTrial(updateData) {
  const allowedFields = [
    'studentId',
    'classId',
    'trialDate',
    'status',
    'remark',
    'parentId',
  ]
  const cleanData = {}

  Object.keys(updateData).forEach((key) => {
    if (!allowedFields.includes(key)) {
      throw new Error(`Invalid field: ${key}`)
    }
  })

  if (updateData.studentId !== undefined)
    cleanData.studentId = updateData.studentId
  if (updateData.classId !== undefined) cleanData.classId = updateData.classId
  if (updateData.parentId !== undefined)
    cleanData.parentId = updateData.parentId
  if (updateData.trialDate !== undefined)
    cleanData.trialDate = updateData.trialDate
  if (updateData.status !== undefined) cleanData.status = updateData.status
  if (updateData.remark !== undefined) cleanData.remark = updateData.remark

  if (Object.keys(cleanData).length === 0) {
    throw new Error('No valid fields provided for update')
  }

  cleanData.updatedAt = new Date().toISOString()
  return cleanData
}

module.exports = { validateTrial, validateUpdateTrial }

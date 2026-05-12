function normalizeIds(value) {
  if (!value) return []
  const ids = Array.isArray(value) ? value.filter(Boolean) : [value]
  return Array.from(new Set(ids.map(id => String(id))))
}

function validateClass(classData) {
  const classFields = ['programId', 'scheduleId', 'scheduleIds', 'schedulesData', 'status']

  Object.keys(classData).forEach((key) => {
    if (!classFields.includes(key)) {
      throw new Error(`Invalid field: ${key}`)
    }
  })

  const scheduleIds = normalizeIds(classData.scheduleIds || classData.scheduleId)

  if (!classData.programId) throw new Error('Program is required')
  if (!scheduleIds.length) throw new Error('At least one schedule is required')

  return {
    programId: classData.programId,
    scheduleIds,
    schedulesData: classData.schedulesData || [],
    status: String(classData.status || 'active').toLowerCase(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function validateUpdateClass(updateData) {
  const allowedFields = ['programId', 'scheduleId', 'scheduleIds', 'schedulesData', 'status']
  const cleanData = {}

  Object.keys(updateData).forEach((key) => {
    if (allowedFields.includes(key)) cleanData[key] = updateData[key]
  })

  if (Object.keys(cleanData).length === 0) {
    throw new Error('No valid fields provided for update')
  }

  if (cleanData.scheduleId || cleanData.scheduleIds) {
    cleanData.scheduleIds = normalizeIds(cleanData.scheduleIds || cleanData.scheduleId)
    delete cleanData.scheduleId
    if (!cleanData.scheduleIds.length) throw new Error('At least one schedule is required')
  }

  if (cleanData.status !== undefined) {
    cleanData.status = String(cleanData.status).toLowerCase()
  }

  cleanData.updatedAt = new Date().toISOString()
  return cleanData
}

module.exports = { validateClass, validateUpdateClass }

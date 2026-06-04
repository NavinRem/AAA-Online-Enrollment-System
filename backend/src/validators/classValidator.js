function normalizeIds(value) {
  if (!value) return []
  const ids = Array.isArray(value) ? value.filter(Boolean) : [value]
  return Array.from(new Set(ids.map((id) => String(id))))
}

function validateClass(classData) {
  const classFields = [
    'programId',
    'scheduleId',
    'scheduleIds',
    'schedulesData',
    'branchIds',
    'status',
  ]

  Object.keys(classData).forEach((key) => {
    if (!classFields.includes(key)) {
      throw new Error(`Invalid field: ${key}`)
    }
  })

  const scheduleIds = normalizeIds(
    classData.scheduleIds || classData.scheduleId,
  )
  const branchIds = normalizeIds(classData.branchIds)

  if (!classData.programId) throw new Error('Program is required')
  if (!scheduleIds.length) throw new Error('At least one schedule is required')
  if (!branchIds.length) throw new Error('At least one branch is required')

  return {
    programId: classData.programId,
    scheduleIds,
    branchIds,
    schedulesData: classData.schedulesData || [],
    status: String(classData.status || 'available').toLowerCase(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function validateUpdateClass(updateData) {
  const allowedFields = [
    'programId',
    'scheduleId',
    'scheduleIds',
    'schedulesData',
    'branchIds',
    'status',
  ]
  const cleanData = {}

  Object.keys(updateData).forEach((key) => {
    if (allowedFields.includes(key)) cleanData[key] = updateData[key]
  })

  if (Object.keys(cleanData).length === 0) {
    throw new Error('No valid fields provided for update')
  }

  if (cleanData.scheduleId || cleanData.scheduleIds) {
    cleanData.scheduleIds = normalizeIds(
      cleanData.scheduleIds || cleanData.scheduleId,
    )
    delete cleanData.scheduleId
    if (!cleanData.scheduleIds.length)
      throw new Error('At least one schedule is required')
  }

  if (cleanData.branchIds !== undefined) {
    cleanData.branchIds = normalizeIds(cleanData.branchIds)
    if (!cleanData.branchIds.length)
      throw new Error('At least one branch is required')
  }

  if (cleanData.status !== undefined) {
    const validStatuses = [
      'available',
      'upcoming',
      'full',
      'cancelled',
      'completed',
      'deleted',
    ]
    cleanData.status = String(cleanData.status).toLowerCase()
    if (!validStatuses.includes(cleanData.status)) {
      throw new Error(
        `Invalid status. Must be one of: available, upcoming, full, cancelled, completed`,
      )
    }
  }

  cleanData.updatedAt = new Date().toISOString()
  return cleanData
}

module.exports = { validateClass, validateUpdateClass }

function validateProgram(programData) {
  const programFields = [
    'name',
    'categoryId',
    'levelId',
    'totalSessions',
    'basePrice',
    'description',
    'maxCapacity',
    'type',
    'profileURL',
  ]

  Object.keys(programData).forEach((key) => {
    if (!programFields.includes(key)) {
      throw new Error(`Invalid field: ${key}`)
    }
  })

  const name = programData.name?.trim()
  if (!name || !programData.categoryId || !programData.levelId) {
    throw new Error('Program Name, Category ID and Level ID are required')
  }

  return {
    name,
    categoryId: programData.categoryId,
    levelId: programData.levelId,
    description: programData.description?.trim() || '',
    totalSessions: parseInt(programData.totalSessions || 0),
    basePrice: parseFloat(programData.basePrice || 0),
    maxCapacity: parseInt(programData.maxCapacity || 0),
    type: programData.type || 'General',
    profileURL: programData.profileURL || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function validateUpdateProgram(updateData) {
  const allowedFields = [
    'name',
    'categoryId',
    'levelId',
    'description',
    'totalSessions',
    'basePrice',
    'maxCapacity',
    'type',
    'profileURL',
  ]
  const cleanData = {}

  Object.keys(updateData).forEach((key) => {
    if (!allowedFields.includes(key)) {
      throw new Error(`Invalid field: ${key}`)
    }
  })

  if (updateData.name !== undefined) cleanData.name = updateData.name.trim()
  if (updateData.categoryId !== undefined)
    cleanData.categoryId = updateData.categoryId
  if (updateData.levelId !== undefined) cleanData.levelId = updateData.levelId
  if (updateData.description !== undefined)
    cleanData.description = updateData.description.trim()
  if (updateData.totalSessions !== undefined)
    cleanData.totalSessions = parseInt(updateData.totalSessions)
  if (updateData.basePrice !== undefined)
    cleanData.basePrice = parseFloat(updateData.basePrice)
  if (updateData.maxCapacity !== undefined)
    cleanData.maxCapacity = parseInt(updateData.maxCapacity)
  if (updateData.type !== undefined) cleanData.type = updateData.type
  if (updateData.profileURL !== undefined)
    cleanData.profileURL = updateData.profileURL

  if (Object.keys(cleanData).length === 0) {
    throw new Error('No valid fields provided for update')
  }

  cleanData.updatedAt = new Date().toISOString()
  return cleanData
}

module.exports = { validateProgram, validateUpdateProgram }

function validateProgram(programData) {
  const programFields = [
    'name',
    'categoryId',
    'levelId',
    'totalSessions',
    'basePrice',
    'description',
    'maxCapacity',
    'minAge',
    'maxAge',
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
    minAge: parseInt(programData.minAge || 0),
    maxAge: parseInt(programData.maxAge || 0),
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
    'minAge',
    'maxAge',
    'type',
    'profileURL',
  ]
  const cleanData = {}

  Object.keys(updateData).forEach((key) => {
    if (allowedFields.includes(key)) {
      cleanData[key] = updateData[key]
    } else throw new Error(`Invalid field: ${key}`)
  })

  if (cleanData.name !== undefined) cleanData.name = cleanData.name.trim()
  if (cleanData.description !== undefined)
    cleanData.description = cleanData.description.trim()
  if (cleanData.totalSessions !== undefined)
    cleanData.totalSessions = parseInt(cleanData.totalSessions || 0)
  if (cleanData.basePrice !== undefined)
    cleanData.basePrice = parseFloat(cleanData.basePrice || 0)
  if (cleanData.maxCapacity !== undefined)
    cleanData.maxCapacity = parseInt(cleanData.maxCapacity || 0)
  if (cleanData.minAge !== undefined)
    cleanData.minAge = parseInt(cleanData.minAge || 0)
  if (cleanData.maxAge !== undefined)
    cleanData.maxAge = parseInt(cleanData.maxAge || 0)

  if (Object.keys(cleanData).length === 0) {
    throw new Error('No valid fields provided for update')
  }

  cleanData.updatedAt = new Date().toISOString()
  return cleanData
}

module.exports = { validateProgram, validateUpdateProgram }

function validateBranch(branchData) {
  const branchFields = ['name', 'abbr', 'location', 'phone']

  Object.keys(branchData).forEach((key) => {
    if (!branchFields.includes(key)) {
      throw new Error(`Invalid field: ${key}`)
    }
  })

  const abbr = branchData.abbr?.toUpperCase().trim()
  const name = branchData.name?.trim()

  if (!abbr || !name) {
    throw new Error('Branch Abbreviation and Name are required')
  }

  return {
    name,
    abbr,
    location: branchData.location?.trim() || '',
    phone: branchData.phone?.trim() || '',
    studentCount: 0,
    classCount: 0,
    programCount: 0,
    newTodayCount: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function validateUpdateBranch(updateData) {
  const allowedFields = ['name', 'abbr', 'location', 'phone']
  const cleanData = {}

  Object.keys(updateData).forEach((key) => {
    if (!allowedFields.includes(key)) {
      throw new Error(`Invalid field: ${key}`)
    }
  })

  if (updateData.name !== undefined) cleanData.name = updateData.name.trim()
  if (updateData.abbr !== undefined) cleanData.abbr = updateData.abbr.toUpperCase().trim()
  if (updateData.location !== undefined) cleanData.location = updateData.location.trim()
  if (updateData.phone !== undefined) cleanData.phone = updateData.phone.trim()

  if (Object.keys(cleanData).length === 0) {
    throw new Error('No valid fields provided for update')
  }

  cleanData.updatedAt = new Date().toISOString()
  return cleanData
}

module.exports = { validateBranch, validateUpdateBranch }

function validateBranch(branchData) {
  const branchFields = ['name', 'abbr', 'location', 'phone', 'color']

  Object.keys(branchData).forEach((key) => {
    if (!branchFields.includes(key)) {
      throw new Error(`Invalid field: ${key}`)
    }
  })

  const abbr = branchData.abbr?.trim()
  const name = branchData.name?.trim()
  const location = branchData.location?.trim()
  const phone = branchData.phone?.trim()

  if (!abbr || !name || !location || !phone) {
    throw new Error(
      'Branch Abbreviation, Name, Location, and Phone are all required',
    )
  }

  return {
    name,
    abbr,
    location: branchData.location?.trim() || '',
    phone: branchData.phone?.trim() || '',
    color: branchData.color || 'blue',
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
  const allowedFields = ['name', 'abbr', 'location', 'phone', 'color']
  const cleanData = {}

  Object.keys(updateData).forEach((key) => {
    if (!allowedFields.includes(key)) {
      throw new Error(`Invalid field: ${key}`)
    }
  })

  if (updateData.name !== undefined) cleanData.name = updateData.name.trim()
  if (updateData.abbr !== undefined) cleanData.abbr = updateData.abbr.trim()
  if (updateData.location !== undefined)
    cleanData.location = updateData.location.trim()
  if (updateData.phone !== undefined) cleanData.phone = updateData.phone.trim()
  if (updateData.color !== undefined) cleanData.color = updateData.color

  if (Object.keys(cleanData).length === 0) {
    throw new Error('No valid fields provided for update')
  }

  cleanData.updatedAt = new Date().toISOString()
  return cleanData
}

module.exports = { validateBranch, validateUpdateBranch }

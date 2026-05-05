const dateHelper = require('../utils/dateHelper')

function validateTerm(termData) {
  const fields = ['name', 'startDate', 'endDate', 'status', 'totalSessions', 'branchId', 'branchIds']
  Object.keys(termData).forEach((key) => {
    if (!fields.includes(key)) throw new Error(`Invalid field: ${key}`)
  })

  if (!termData.name) throw new Error('Term Name is required')

  dateHelper.validateAndParseDate(termData.startDate, 'Start Date', {
    allowFuture: true,
  })

  // If totalSessions is provided, we can auto-calculate or validate endDate
  const totalSessions = parseInt(termData.totalSessions || 11)
  const expectedEndDate = dateHelper.calculateEndDate(termData.startDate, totalSessions)

  if (termData.endDate && termData.endDate !== expectedEndDate) {
    throw new Error(`End Date "${termData.endDate}" does not match the calculated end date "${expectedEndDate}" for ${totalSessions} sessions.`)
  }

  const endDate = termData.endDate || expectedEndDate

  const forbiddenKeywords = ['category', 'level', 'program', 'course']
  const lowerName = termData.name.toLowerCase()
  const foundKeyword = forbiddenKeywords.find((k) => {
    const regex = new RegExp(`\\b${k}\\b`, 'i')
    return regex.test(lowerName)
  })
  if (foundKeyword)
    throw new Error(`Term name cannot contain "${foundKeyword}"`)

  return {
    name: termData.name.trim(),
    startDate: termData.startDate,
    endDate,
    totalSessions,
    branchIds: Array.isArray(termData.branchIds) ? termData.branchIds : (termData.branchId ? [termData.branchId] : []),
    status: dateHelper.calculateStatus(termData.startDate, endDate),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function validateUpdateTerm(updateData) {
  const allowedFields = ['name', 'startDate', 'endDate', 'status', 'totalSessions', 'branchIds']
  const cleanData = {}

  Object.keys(updateData).forEach((key) => {
    if (allowedFields.includes(key)) {
      cleanData[key] = updateData[key]
    }
  })

  if (Object.keys(cleanData).length === 0) {
    throw new Error('No valid fields provided for update')
  }

  if (cleanData.name) cleanData.name = cleanData.name.trim()

  if (cleanData.startDate || cleanData.totalSessions) {
    const startDate = cleanData.startDate || updateData.startDate // Might need existing data here, but validator usually only has the patch
    const totalSessions = cleanData.totalSessions || updateData.totalSessions
    
    if (startDate && totalSessions) {
      cleanData.endDate = dateHelper.calculateEndDate(startDate, totalSessions)
      // Automatically update status if dates change
      cleanData.status = dateHelper.calculateStatus(startDate, cleanData.endDate)
    }
  } else if (cleanData.endDate) {
    dateHelper.validateAndParseDate(cleanData.endDate, 'End Date', {
      allowFuture: true,
    })
    if (updateData.startDate) {
      cleanData.status = dateHelper.calculateStatus(updateData.startDate, cleanData.endDate)
    }
  }

  cleanData.updatedAt = new Date().toISOString()
  return cleanData
}

module.exports = { validateTerm, validateUpdateTerm }

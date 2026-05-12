const dateHelper = require('../utils/dateHelper')

function validateTerm(termData) {
  const fields = ['name', 'startDate', 'endDate', 'status', 'totalSessions', 'branchId', 'branchIds', 'offerings', 'duplicateFromTermId', 'branchSettings']
  Object.keys(termData).forEach((key) => {
    if (!fields.includes(key)) throw new Error(`Invalid field: ${key}`)
  })

  if (!termData.name) throw new Error('Term Name is required')

  const branchSettings = Array.isArray(termData.branchSettings) ? termData.branchSettings : []
  const branchIds = Array.isArray(termData.branchIds) ? termData.branchIds : (termData.branchId ? [termData.branchId] : [])
  const totalSessions = parseInt(termData.totalSessions || 11)

  // Use global dates if branchSettings is empty, otherwise branchSettings takes priority
  let startDate = termData.startDate
  let endDate = termData.endDate

  if (branchSettings.length > 0) {
    // If we have branch settings, use the first one's dates as the global "representative" dates
    startDate = branchSettings[0].startDate
    endDate = branchSettings[0].endDate
  } else if (startDate) {
    dateHelper.validateAndParseDate(startDate, 'Start Date', { allowFuture: true })
    const expectedEndDate = dateHelper.calculateEndDate(startDate, totalSessions)
    if (endDate && endDate !== expectedEndDate) {
      throw new Error(`End Date "${endDate}" does not match the calculated end date "${expectedEndDate}" for ${totalSessions} sessions.`)
    }
    endDate = endDate || expectedEndDate
  }

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
    startDate: startDate || '',
    endDate: endDate || '',
    totalSessions,
    branchIds,
    branchSettings,
    offerings: Array.isArray(termData.offerings) ? termData.offerings : [],
    duplicateFromTermId: termData.duplicateFromTermId || '',
    status: startDate && endDate ? dateHelper.calculateStatus(startDate, endDate) : 'upcoming',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function validateUpdateTerm(updateData) {
  const allowedFields = ['name', 'startDate', 'endDate', 'status', 'totalSessions', 'branchIds', 'offerings', 'branchSettings', 'newOfferingsRequest', 'deleteOfferingsRequest']
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
    const startDate = cleanData.startDate || updateData.startDate
    const totalSessions = cleanData.totalSessions || updateData.totalSessions
    
    if (startDate && totalSessions) {
      cleanData.endDate = dateHelper.calculateEndDate(startDate, totalSessions)
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

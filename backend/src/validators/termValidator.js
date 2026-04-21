const dateHelper = require('../utils/dateHelper')

function validateTerm(termData) {
  const fields = ['name', 'startDate', 'endDate', 'status']
  Object.keys(termData).forEach((key) => {
    if (!fields.includes(key)) throw new Error(`Invalid field: ${key}`)
  })

  if (!termData.name) throw new Error('Term Name is required')

  dateHelper.validateAndParseDate(termData.startDate, 'Start Date', {
    allowFuture: true,
  })
  dateHelper.validateAndParseDate(termData.endDate, 'End Date', {
    allowFuture: true,
  })

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
    endDate: termData.endDate,
    status: termData.status || 'upcoming',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function validateUpdateTerm(updateData) {
  const allowedFields = ['name', 'startDate', 'endDate', 'status']
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

  if (cleanData.startDate) {
    dateHelper.validateAndParseDate(cleanData.startDate, 'Start Date', {
      allowFuture: true,
    })
  }
  if (cleanData.endDate) {
    dateHelper.validateAndParseDate(cleanData.endDate, 'End Date', {
      allowFuture: true,
    })
  }

  cleanData.updatedAt = new Date().toISOString()
  return cleanData
}

module.exports = { validateTerm, validateUpdateTerm }

function validateCategory(categoryData) {
  const fields = ['name']
  Object.keys(categoryData).forEach((key) => {
    if (!fields.includes(key)) throw new Error(`Invalid field: ${key}`)
  })
  if (!categoryData.name) throw new Error('Category Name is required')

  const forbiddenKeywords = ['term', 'level', 'category', 'session', 'program', 'course']
  const lowerName = categoryData.name.toLowerCase()
  const foundKeyword = forbiddenKeywords.find((k) => {
    const regex = new RegExp(`\\b${k}\\b`, 'i')
    return regex.test(lowerName)
  })
  if (foundKeyword) throw new Error(`Category name cannot contain "${foundKeyword}"`)

  return {
    name: categoryData.name.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function validateLevel(levelData) {
  const fields = ['name']
  Object.keys(levelData).forEach((key) => {
    if (!fields.includes(key)) throw new Error(`Invalid field: ${key}`)
  })
  if (!levelData.name) throw new Error('Level Name is required')

  const forbiddenKeywords = ['term', 'category', 'program', 'course']
  const lowerName = levelData.name.toLowerCase()
  const foundKeyword = forbiddenKeywords.find((k) => {
    const regex = new RegExp(`\\b${k}\\b`, 'i')
    return regex.test(lowerName)
  })
  if (foundKeyword) throw new Error(`Level name cannot contain "${foundKeyword}"`)

  return {
    name: levelData.name.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function validateTerm(termData) {
  const fields = ['name', 'startDate', 'endDate', 'status']
  Object.keys(termData).forEach((key) => {
    if (!fields.includes(key)) throw new Error(`Invalid field: ${key}`)
  })
  if (!termData.name || !termData.startDate || !termData.endDate) {
    throw new Error('Term Name, Start Date, and End Date are required')
  }

  const forbiddenKeywords = ['category', 'level', 'program', 'course']
  const lowerName = termData.name.toLowerCase()
  const foundKeyword = forbiddenKeywords.find((k) => {
    const regex = new RegExp(`\\b${k}\\b`, 'i')
    return regex.test(lowerName)
  })
  if (foundKeyword) throw new Error(`Term name cannot contain "${foundKeyword}"`)

  return {
    name: termData.name.trim(),
    startDate: termData.startDate,
    endDate: termData.endDate,
    status: termData.status || 'upcoming',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

module.exports = { validateCategory, validateLevel, validateTerm }

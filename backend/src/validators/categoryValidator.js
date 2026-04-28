function validateCategory(categoryData) {
  const fields = ['name', 'profileURL']
  Object.keys(categoryData).forEach((key) => {
    if (!fields.includes(key)) throw new Error(`Invalid field: ${key}`)
  })

  if (!categoryData.name || typeof categoryData.name !== 'string') {
    throw new Error('Category Name is required and must be a string')
  }

  const name = categoryData.name.trim()
  const forbiddenKeywords = [
    'term',
    'level',
    'category',
    'session',
    'program',
    'course',
  ]
  const lowerName = name.toLowerCase()

  const foundKeyword = forbiddenKeywords.find((k) => {
    const regex = new RegExp(`\\b${k}\\b`, 'i')
    return regex.test(lowerName)
  })

  if (foundKeyword) {
    throw new Error(`Category name cannot contain "${foundKeyword}"`)
  }

  return {
    name,
    profileURL: categoryData.profileURL || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function validateUpdateCategory(updateData) {
  const fields = ['name', 'profileURL']
  Object.keys(updateData).forEach((key) => {
    if (!fields.includes(key)) throw new Error(`Invalid field: ${key}`)
  })

  const validated = {
    updatedAt: new Date().toISOString(),
  }

  if (updateData.name !== undefined) {
    if (typeof updateData.name !== 'string' || !updateData.name.trim()) {
      throw new Error('Category Name must be a non-empty string')
    }

    const name = updateData.name.trim()
    const forbiddenKeywords = [
      'term',
      'level',
      'category',
      'session',
      'program',
      'course',
    ]
    const lowerName = name.toLowerCase()

    const foundKeyword = forbiddenKeywords.find((k) => {
      const regex = new RegExp(`\\b${k}\\b`, 'i')
      return regex.test(lowerName)
    })

    if (foundKeyword) {
      throw new Error(`Category name cannot contain "${foundKeyword}"`)
    }

    validated.name = name
  }

  if (updateData.profileURL !== undefined) {
    validated.profileURL = updateData.profileURL
  }

  return validated
}

module.exports = { validateCategory, validateUpdateCategory }

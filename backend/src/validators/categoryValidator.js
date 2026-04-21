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

function validateUpdateCategory(updateData) {
  if (!updateData.name) return { updatedAt: new Date().toISOString() }
  
  return {
    name: updateData.name.trim(),
    updatedAt: new Date().toISOString(),
  }
}

module.exports = { validateCategory, validateUpdateCategory }

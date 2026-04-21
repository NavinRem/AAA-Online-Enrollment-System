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

function validateUpdateLevel(updateData) {
  if (!updateData.name) return { updatedAt: new Date().toISOString() }

  return {
    name: updateData.name.trim(),
    updatedAt: new Date().toISOString(),
  }
}

module.exports = { validateLevel, validateUpdateLevel }

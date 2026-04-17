function validateTeacher(teacherData) {
  const teacherFields = ['name', 'profileURL', 'status']
  Object.keys(teacherData).forEach((key) => {
    if (!teacherFields.includes(key)) {
      throw new Error(`Invalid field: ${key}`)
    }
  })

  const name = teacherData.name?.trim()
  const profileURL = teacherData.profileURL || null
  const status = teacherData.status || 'active'

  if (!name) {
    throw new Error('Name is required for teacher registration')
  }

  if (profileURL && typeof profileURL === 'string' && !profileURL.match(/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/)) {
    throw new Error('Invalid profileURL format')
  }

  return {
    name,
    profileURL,
    status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function validateUpdateTeacher(updateData) {
  const allowedFields = ['name', 'profileURL', 'status']
  const cleanData = {}

  Object.keys(updateData).forEach((key) => {
    if (!allowedFields.includes(key)) {
      throw new Error(`Invalid field: ${key}`)
    }
  })

  if (updateData.name !== undefined) cleanData.name = updateData.name.trim()
  if (updateData.profileURL !== undefined) {
    cleanData.profileURL = updateData.profileURL
  }
  if (updateData.status !== undefined) cleanData.status = updateData.status

  if (Object.keys(cleanData).length === 0) {
    throw new Error('No valid fields provided for update')
  }

  cleanData.updatedAt = new Date().toISOString()
  return cleanData
}

module.exports = { validateTeacher, validateUpdateTeacher }

function validateTeacher(teacherData) {
  const teacherFields = ['name', 'profileURL', 'email', 'status']
  Object.keys(teacherData).forEach((key) => {
    if (!teacherFields.includes(key)) {
      throw new Error(`Invalid field: ${key}`)
    }
  })

  const name = teacherData.name?.trim()
  const profileURL = teacherData.profileURL || null
  const status = teacherData.status || 'active'
  const email = teacherData.email?.trim()

  if (!email) {
    throw new Error('Email is required for teacher registration')
  }

  if (!name) {
    throw new Error('Name is required for teacher registration')
  }

  if (
    profileURL &&
    typeof profileURL === 'string' &&
    !profileURL.match(/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/)
  ) {
    throw new Error('Invalid profileURL format')
  }

  if (
    email &&
    typeof email === 'string' &&
    !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  ) {
    throw new Error('Invalid email format')
  }

  return {
    name,
    profileURL,
    email,
    status,
  }
}

function validateUpdateTeacher(updateData) {
  const allowedFields = ['name', 'profileURL', 'email', 'status', 'updatedAt']
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
  if (updateData.email !== undefined) cleanData.email = updateData.email.trim()
  if (updateData.status !== undefined) cleanData.status = updateData.status
  if (updateData.updatedAt !== undefined) cleanData.updatedAt = updateData.updatedAt

  if (Object.keys(cleanData).length === 0) {
    throw new Error('No valid fields provided for update')
  }

  return cleanData
}

module.exports = { validateTeacher, validateUpdateTeacher }

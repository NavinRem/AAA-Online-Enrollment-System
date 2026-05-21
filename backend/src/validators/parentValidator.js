function validateParent(parentData) {
  const allowedFields = [
    'childrenInfo',
    'name',
    'email',
    'phone',
    'profileURL',
    'status',
    'studentId',
    'role',
  ]

  Object.keys(parentData).forEach((key) => {
    if (!allowedFields.includes(key)) {
      throw new Error(`Invalid field: ${key}`)
    }
  })

  const childrenInfo = parentData.childrenInfo || []
  const name = parentData.name?.trim()
  const email = parentData.email?.trim()
  const phone = parentData.phone?.trim()
  const profileURL = parentData.profileURL
  const status = parentData.status || 'active'
  const studentId = parentData.studentId
  const role = parentData.role

  if (!name || !email || !phone) {
    throw new Error(
      'Name, Email, and Phone are required for parent registration',
    )
  }

  if (!email.includes('@')) {
    throw new Error('Invalid email format')
  }

  if (!phone.match(/^[0-9+]{8,15}$/)) {
    throw new Error('Invalid phone number format')
  }

  if (!['active', 'inactive'].includes(status.toLowerCase())) {
    throw new Error('Invalid status')
  }

  return {
    childrenInfo,
    name,
    email,
    phone,
    profileURL,
    status,
  }
}

function validateUpdateParent(updateData) {
  const allowedFields = [
    'name',
    'email',
    'phone',
    'profileURL',
    'status',
    'childrenInfo',
  ]
  const cleanData = {}

  Object.keys(updateData).forEach((key) => {
    if (!allowedFields.includes(key)) {
      throw new Error(`Invalid field: ${key}`)
    }
  })

  if (updateData.name !== undefined) cleanData.name = updateData.name.trim()
  if (updateData.email !== undefined) cleanData.email = updateData.email.trim()
  if (updateData.phone !== undefined) cleanData.phone = updateData.phone.trim()
  if (updateData.profileURL !== undefined) {
    cleanData.profileURL = updateData.profileURL
  }
  if (updateData.status !== undefined) {
    if (!['active', 'inactive'].includes(updateData.status.toLowerCase())) {
      throw new Error('Invalid status')
    }
    cleanData.status = updateData.status
  }
  if (updateData.childrenInfo !== undefined) {
    if (!Array.isArray(updateData.childrenInfo)) {
      throw new Error('childrenInfo must be an array')
    }
    cleanData.childrenInfo = updateData.childrenInfo
  }

  if (Object.keys(cleanData).length === 0) {
    throw new Error('No valid fields provided for update')
  }

  cleanData.updatedAt = new Date().toISOString()
  return cleanData
}

module.exports = { validateParent, validateUpdateParent }

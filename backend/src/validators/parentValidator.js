function validateParent(parentData) {
  const parentFields = ['name', 'email', 'phone', 'profileURL', 'status']

  Object.keys(parentData).forEach((key) => {
    if (!parentFields.includes(key)) {
      throw new Error(`Invalid field: ${key}`)
    }
  })

  const name = parentData.name?.trim()
  const email = parentData.email?.trim()
  const phone = parentData.phone?.trim()
  const profileURL = parentData.profileURL
  const status = parentData.status || 'active'

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

  if (!['active', 'inactive'].includes(status)) {
    throw new Error('Invalid status')
  }

  return {
    name,
    email,
    phone,
    profileURL,
    status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function validateUpdateParent(updateData) {
  const allowedFields = [
    'name',
    'email',
    'phone',
    'profileURL',
    'status',
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
    if (!['active', 'inactive'].includes(updateData.status)) {
      throw new Error('Invalid status')
    }
    cleanData.status = updateData.status
  }

  if (Object.keys(cleanData).length === 0) {
    throw new Error('No valid fields provided for update')
  }

  cleanData.updatedAt = new Date().toISOString()
  return cleanData
}

module.exports = { validateParent, validateUpdateParent }

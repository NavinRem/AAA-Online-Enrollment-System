function validateAdmin(adminData) {
  const adminFields = ['name', 'email', 'profileURL', 'status', 'branch', 'phone']
  Object.keys(adminData).forEach((key) => {
    if (!adminFields.includes(key)) {
      throw new Error(`Invalid field: ${key}`)
    }
  })

  const name = adminData.name?.trim()
  const email = adminData.email?.trim()
  const profileURL = adminData.profileURL || null
  const status = adminData.status || 'active'
  const branch = adminData.branch || ''
  const phone = adminData.phone || ''

  if (!name || !email) {
    throw new Error('Name and email are required for admin registration')
  }

  if (!email.includes('@')) {
    throw new Error('Invalid email format')
  }

  return {
    name,
    email,
    profileURL,
    status,
    branch,
    phone,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function validateUpdateAdmin(updateData) {
  const allowedFields = ['name', 'email', 'profileURL', 'status', 'branch', 'phone']
  const cleanData = {}

  Object.keys(updateData).forEach((key) => {
    if (!allowedFields.includes(key)) {
      throw new Error(`Invalid field: ${key}`)
    }
  })

  if (updateData.name !== undefined) cleanData.name = updateData.name.trim()
  if (updateData.email !== undefined)
    cleanData.email = updateData.email.trim().toLowerCase()
  if (updateData.profileURL !== undefined) {
    cleanData.profileURL = updateData.profileURL
  }
  if (updateData.status !== undefined) cleanData.status = updateData.status
  if (updateData.branch !== undefined) cleanData.branch = updateData.branch
  if (updateData.phone !== undefined) cleanData.phone = updateData.phone

  if (Object.keys(cleanData).length === 0) {
    throw new Error('No valid fields provided for update')
  }

  cleanData.updatedAt = new Date().toISOString()
  return cleanData
}

module.exports = { validateAdmin, validateUpdateAdmin }

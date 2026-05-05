function validateStudent(studentData) {
  const allowedFields = [
    'parentId',
    'name',
    'dob',
    'age',
    'profileURL',
    'status',
  ]

  Object.keys(studentData).forEach((key) => {
    if (!allowedFields.includes(key)) {
      throw new Error(`Invalid field: ${key}`)
    }
  })

  const parentId = studentData.parentId
  const name = studentData.name?.trim()
  const dob = studentData.dob?.trim()

  if (!parentId || typeof parentId !== 'string' || parentId.trim() === '') {
    throw new Error('Valid Parent ID is required')
  }
  
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new Error('Valid Student Name is required')
  }

  if (!dob || typeof dob !== 'string' || dob.trim() === '') {
    throw new Error('Date of Birth is required')
  }

  return {
    parentId,
    name,
    dob,
    age: studentData.age,
    profileURL: studentData.profileURL || '',
    status: studentData.status || 'inactive',
  }
}

function validateUpdateStudent(updateData) {
  const allowedFields = ['name', 'dob', 'age', 'profileURL', 'status', 'parentId', 'overrideReason', 'overrideRemark', 'manualStatus', 'archived']

  const cleanData = {}

  Object.keys(updateData).forEach((key) => {
    if (!allowedFields.includes(key)) {
      throw new Error(`Invalid field: ${key}`)
    }
  })

  if (updateData.name !== undefined) {
    const trimmed = updateData.name?.trim()
    if (!trimmed || trimmed === '') {
      throw new Error('Student name cannot be empty')
    }
    cleanData.name = trimmed
  }

  if (updateData.dob !== undefined) {
    cleanData.dob = updateData.dob.trim()
  }

  if (updateData.age !== undefined) {
    cleanData.age = updateData.age
  }

  if (updateData.profileURL !== undefined) {
    cleanData.profileURL = updateData.profileURL
  }

  if (updateData.status !== undefined) {
    cleanData.status = updateData.status
  }

  if (updateData.parentId !== undefined) {
    cleanData.parentId = updateData.parentId
  }

  if (updateData.overrideReason !== undefined) {
    cleanData.overrideReason = updateData.overrideReason
  }

  if (updateData.overrideRemark !== undefined) {
    cleanData.overrideRemark = updateData.overrideRemark
  }

  if (updateData.manualStatus !== undefined) {
    cleanData.manualStatus = updateData.manualStatus
  }

  if (updateData.archived !== undefined) {
    cleanData.archived = updateData.archived
  }

  if (Object.keys(cleanData).length === 0) {
    throw new Error('No valid fields provided')
  }

  return cleanData
}

module.exports = { validateStudent, validateUpdateStudent }

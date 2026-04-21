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

  if (!parentId || !name || !dob) {
    throw new Error('Parent ID, Name, and Date of Birth are required')
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
  const allowedFields = ['name', 'dob', 'age', 'profileURL', 'status']

  const cleanData = {}

  Object.keys(updateData).forEach((key) => {
    if (!allowedFields.includes(key)) {
      throw new Error(`Invalid field: ${key}`)
    }
  })

  if (updateData.name !== undefined) {
    cleanData.name = updateData.name.trim()
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

  if (Object.keys(cleanData).length === 0) {
    throw new Error('No valid fields provided')
  }

  return cleanData
}

module.exports = { validateStudent, validateUpdateStudent }

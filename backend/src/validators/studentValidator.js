const profileHelper = require('../utils/profileHelper')

function validateStudent(studentData) {
  const studentFields = [
    'parentId',
    'name',
    'dob',
    'age',
    'profileURL',
    'status',
  ]

  Object.keys(studentData).forEach((key) => {
    if (!studentFields.includes(key)) {
      throw new Error(`Invalid field: ${key}`)
    }
  })

  const name = studentData.name?.trim()
  const dob = studentData.dob?.trim()
  const profileURL = studentData.profileURL || null
  const status = studentData.status || 'inactive'
  const parentId = studentData.parentId

  if (!parentId || !name || !dob) {
    throw new Error('Parent ID, Name, and Date of Birth are required')
  }

  const age =
    studentData.age ||
    (profileHelper.calculateAge ? profileHelper.calculateAge(dob) : 0)

  return {
    parentId,
    name,
    dob,
    age,
    profileURL,
    status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function validateUpdateStudent(updateData) {
  const allowedFields = [
    'parentId',
    'name',
    'dob',
    'age',
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
  if (updateData.dob !== undefined) cleanData.dob = updateData.dob.trim()
  if (updateData.age !== undefined) cleanData.age = updateData.age
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

module.exports = { validateStudent, validateUpdateStudent }

const dateHelper = require('../utils/dateHelper')

function validateEnrollment(enrollmentData) {
  const enrollmentFields = [
    'parentId',
    'studentId',
    'programId',
    'classId',
    'enrollAt',
    'enrollmentType',
    'status',
    'paymentStatus',
    'isProrated',
    'isSponsorship',
    'sponsorName',
    'isCustomPrice',
    'discountAmount',
    'enrolledSessions',
    'amount',
    'remark',
  ]

  Object.keys(enrollmentData).forEach((key) => {
    if (!enrollmentFields.includes(key)) {
      throw new Error(`Invalid field: ${key}`)
    }
  })

  if (
    !enrollmentData.parentId ||
    !enrollmentData.studentId ||
    !enrollmentData.classId ||
    !enrollmentData.programId
  ) {
    throw new Error('parentId, studentId, programId, and classId are required')
  }

  if (enrollmentData.enrollAt) {
    dateHelper.validateAndParseDate(
      enrollmentData.enrollAt,
      'Enrollment Date',
      { allowFuture: true },
    )
  }

  return {
    parentId: enrollmentData.parentId,
    studentId: enrollmentData.studentId,
    programId: enrollmentData.programId,
    classId: enrollmentData.classId,
    enrollAt: enrollmentData.enrollAt || new Date().toISOString(),
    enrollmentType: enrollmentData.enrollmentType || '',
    status: enrollmentData.status || 'pending',
    paymentStatus: enrollmentData.paymentStatus || 'unpaid',
    isProrated: !!enrollmentData.isProrated,
    isSponsorship: !!enrollmentData.isSponsorship,
    sponsorName: enrollmentData.sponsorName || '',
    isCustomPrice: !!enrollmentData.isCustomPrice,
    discountAmount: parseFloat(enrollmentData.discountAmount || 0),
    enrolledSessions: parseInt(enrollmentData.enrolledSessions || 0),
    amount: parseFloat(enrollmentData.amount || 0),
    remark: enrollmentData.remark || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function validateUpdateEnrollment(updateData) {
  const allowedFields = [
    'parentId',
    'studentId',
    'programId',
    'classId',
    'enrollAt',
    'enrollmentType',
    'status',
    'paymentStatus',
    'isProrated',
    'isSponsorship',
    'sponsorName',
    'isCustomPrice',
    'discountAmount',
    'enrolledSessions',
    'amount',
    'remark',
  ]
  const cleanData = {}

  Object.keys(updateData).forEach((key) => {
    if (allowedFields.includes(key)) {
      cleanData[key] = updateData[key]
    }
  })

  if (Object.keys(cleanData).length === 0) {
    throw new Error('No valid fields provided for update')
  }

  if (cleanData.enrollAt) {
    dateHelper.validateAndParseDate(cleanData.enrollAt, 'Enrollment Date', {
      allowFuture: true,
    })
  }

  if (cleanData.discountAmount !== undefined)
    cleanData.discountAmount = parseFloat(cleanData.discountAmount || 0)
  if (cleanData.enrolledSessions !== undefined)
    cleanData.enrolledSessions = parseInt(cleanData.enrolledSessions || 0)
  if (cleanData.amount !== undefined)
    cleanData.amount = parseFloat(cleanData.amount || 0)
  if (cleanData.isProrated !== undefined)
    cleanData.isProrated = !!cleanData.isProrated
  if (cleanData.isSponsorship !== undefined)
    cleanData.isSponsorship = !!cleanData.isSponsorship
  if (cleanData.isCustomPrice !== undefined)
    cleanData.isCustomPrice = !!cleanData.isCustomPrice

  cleanData.updatedAt = new Date().toISOString()
  return cleanData
}

module.exports = { validateEnrollment, validateUpdateEnrollment }

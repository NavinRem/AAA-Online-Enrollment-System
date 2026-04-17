function validateEnrollment(enrollmentData) {
  const enrollmentFields = [
    'parentId',
    'studentId',
    'classId',
    'isProrated',
    'isSponsorship',
    'sponsorName',
    'isCustomPrice',
    'discountAmount',
    'enrolledSessions',
    'totalSessions',
    'remainingSessions',
    'passedSessions',
    'prorateSavings',
    'amount',
    'remark',
    'status',
    'paymentStatus',
    'enrollmentType',
    'branchId',
    'enrollAt',
    // Snapshot fields (Rich Data)
    'parent',
    'student',
    'class',
  ]

  Object.keys(enrollmentData).forEach((key) => {
    if (!enrollmentFields.includes(key)) {
      throw new Error(`Invalid field: ${key}`)
    }
  })

  if (
    !enrollmentData.parentId ||
    !enrollmentData.studentId ||
    !enrollmentData.classId
  ) {
    throw new Error('parentId, studentId, and classId are required')
  }

  return {
    parentId: enrollmentData.parentId,
    studentId: enrollmentData.studentId,
    classId: enrollmentData.classId,
    status: enrollmentData.status || 'pending',
    paymentStatus: enrollmentData.paymentStatus || 'unpaid',
    enrollmentType: enrollmentData.enrollmentType,
    isProrated: !!enrollmentData.isProrated,
    isSponsorship: !!enrollmentData.isSponsorship,
    sponsorName: enrollmentData.sponsorName || '',
    isCustomPrice: !!enrollmentData.isCustomPrice,
    discountAmount: parseFloat(enrollmentData.discountAmount || 0),
    enrolledSessions: parseInt(enrollmentData.enrolledSessions || 0),
    amount: parseFloat(enrollmentData.amount || 0),
    remark: enrollmentData.remark || '',
    parent: enrollmentData.parent || null,
    student: enrollmentData.student || null,
    class: enrollmentData.class || null,
    enrollAt: enrollmentData.enrollAt || new Date().toISOString(),
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
    'enrollmentType',
    'isProrated',
    'isSponsorship',
    'sponsorName',
    'isCustomPrice',
    'discountAmount',
    'enrolledSessions',
    'amount',
    'remark',
    'status',
    'paymentStatus',
    'parent',
    'student',
    'class',
  ]
  const cleanData = {}

  Object.keys(updateData).forEach((key) => {
    if (!allowedFields.includes(key)) {
      throw new Error(`Invalid field: ${key}`)
    }
  })

  if (updateData.parentId !== undefined) cleanData.parentId = updateData.parentId
  if (updateData.studentId !== undefined) cleanData.studentId = updateData.studentId
  if (updateData.programId !== undefined) cleanData.programId = updateData.programId
  if (updateData.classId !== undefined) cleanData.classId = updateData.classId
  if (updateData.status !== undefined) cleanData.status = updateData.status
  if (updateData.paymentStatus !== undefined) cleanData.paymentStatus = updateData.paymentStatus
  if (updateData.enrollmentType !== undefined) cleanData.enrollmentType = updateData.enrollmentType
  if (updateData.isProrated !== undefined) cleanData.isProrated = !!updateData.isProrated
  if (updateData.isSponsorship !== undefined) cleanData.isSponsorship = !!updateData.isSponsorship
  if (updateData.sponsorName !== undefined) cleanData.sponsorName = updateData.sponsorName
  if (updateData.isCustomPrice !== undefined) cleanData.isCustomPrice = !!updateData.isCustomPrice
  if (updateData.discountAmount !== undefined) cleanData.discountAmount = parseFloat(updateData.discountAmount || 0)
  if (updateData.enrolledSessions !== undefined) cleanData.enrolledSessions = parseInt(updateData.enrolledSessions || 0)
  if (updateData.amount !== undefined) cleanData.amount = parseFloat(updateData.amount || 0)
  if (updateData.remark !== undefined) cleanData.remark = updateData.remark

  // Update snapshots if provided
  if (updateData.parent !== undefined) cleanData.parent = updateData.parent
  if (updateData.student !== undefined) cleanData.student = updateData.student
  if (updateData.class !== undefined) cleanData.class = updateData.class

  if (Object.keys(cleanData).length === 0) {
    throw new Error('No valid fields provided for update')
  }

  cleanData.updatedAt = new Date().toISOString()
  return cleanData
}

module.exports = { validateEnrollment, validateUpdateEnrollment }

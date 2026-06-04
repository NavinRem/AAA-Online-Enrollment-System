const dateHelper = require('../utils/dateHelper')

function validateEnrollment(enrollmentData) {
  const enrollmentFields = [
    'parentId',
    'studentId',
    'programId',
    'classId',
    'termId',
    'termOfferingId',
    'enrollAt',
    'enrollmentType',
    'status',
    'paymentStatus',
    'isProrated',
    'isSponsorship',
    'sponsorName',
    'isCustomPrice',
    'discountAmount',
    'discountType',
    'customPrice',
    'enrolledSessions',
    'amount',
    'remark',
    'hasPassedExam',
    'hasReceivedCertificate',
    'hasReceivedReportCard',
    'transactionId',
    'receiptId',
    'branchId',
    'scheduleId',
    'transferredSessions',
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
    !enrollmentData.programId ||
    !enrollmentData.termId ||
    !enrollmentData.termOfferingId
  ) {
    throw new Error(
      'parentId, studentId, programId, classId, termId, and termOfferingId are required',
    )
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
    termId: enrollmentData.termId,
    termOfferingId: enrollmentData.termOfferingId,
    enrollAt: enrollmentData.enrollAt || new Date().toISOString(),
    enrollmentType: enrollmentData.enrollmentType || '',
    status: String(enrollmentData.status || 'unpaid').toLowerCase(),
    paymentStatus: String(
      enrollmentData.paymentStatus || 'unpaid',
    ).toLowerCase(),
    isProrated: !!enrollmentData.isProrated,
    isSponsorship: !!enrollmentData.isSponsorship,
    sponsorName: enrollmentData.sponsorName || '',
    isCustomPrice: !!enrollmentData.isCustomPrice,
    customPrice: parseFloat(enrollmentData.customPrice || 0),
    discountAmount: parseFloat(enrollmentData.discountAmount || 0),
    enrolledSessions: parseInt(enrollmentData.enrolledSessions || 0),
    amount: parseFloat(enrollmentData.amount || 0),
    remark: enrollmentData.remark || '',
    hasPassedExam: !!enrollmentData.hasPassedExam,
    hasReceivedCertificate: !!enrollmentData.hasReceivedCertificate,
    hasReceivedReportCard: !!enrollmentData.hasReceivedReportCard,
    transactionId: enrollmentData.transactionId || '',
    receiptId: enrollmentData.receiptId || '',
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
    'termId',
    'termOfferingId',
    'enrollAt',
    'enrollmentType',
    'status',
    'paymentStatus',
    'isProrated',
    'isSponsorship',
    'sponsorName',
    'isCustomPrice',
    'customPrice',
    'discountAmount',
    'enrolledSessions',
    'amount',
    'remark',
    'hasPassedExam',
    'hasReceivedCertificate',
    'hasReceivedReportCard',
    'transactionId',
    'receiptId',
    'branchId',
    'scheduleId',
    'transferredSessions',
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
  if (cleanData.customPrice !== undefined)
    cleanData.customPrice = parseFloat(cleanData.customPrice || 0)
  if (cleanData.isProrated !== undefined)
    cleanData.isProrated = !!cleanData.isProrated
  if (cleanData.isSponsorship !== undefined)
    cleanData.isSponsorship = !!cleanData.isSponsorship
  if (cleanData.isCustomPrice !== undefined)
    cleanData.isCustomPrice = !!cleanData.isCustomPrice

  if (cleanData.status !== undefined)
    cleanData.status = String(cleanData.status).toLowerCase()
  if (cleanData.paymentStatus !== undefined)
    cleanData.paymentStatus = String(cleanData.paymentStatus).toLowerCase()
  
  if (cleanData.hasPassedExam !== undefined)
    cleanData.hasPassedExam = !!cleanData.hasPassedExam
  if (cleanData.hasReceivedCertificate !== undefined)
    cleanData.hasReceivedCertificate = !!cleanData.hasReceivedCertificate
  if (cleanData.hasReceivedReportCard !== undefined)
    cleanData.hasReceivedReportCard = !!cleanData.hasReceivedReportCard

  cleanData.updatedAt = new Date().toISOString()
  return cleanData
}

module.exports = { validateEnrollment, validateUpdateEnrollment }

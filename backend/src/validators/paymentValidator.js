function validatePayment(paymentData) {
  const paymentFields = [
    'enrollmentId',
    'parentId',
    'amount',
    'method',
    'status',
    'paidAt',
    'remark',
    'transactionId',
    'receiptId',
  ]

  Object.keys(paymentData).forEach((key) => {
    if (!paymentFields.includes(key)) {
      throw new Error(`Invalid field: ${key}`)
    }
  })

  if (
    !paymentData.enrollmentId ||
    !paymentData.parentId ||
    paymentData.amount === undefined
  ) {
    throw new Error('enrollmentId, parentId, and amount are required')
  }

  return {
    enrollmentId: paymentData.enrollmentId,
    parentId: paymentData.parentId,
    amount: parseFloat(paymentData.amount),
    method: paymentData.method || 'credit_card',
    status: paymentData.status || 'pending',
    paidAt: paymentData.paidAt || new Date().toISOString(),
    remark: paymentData.remark || '',
    transactionId: paymentData.transactionId || '',
    receiptId: paymentData.receiptId || '',
  }
}

module.exports = { validatePayment }

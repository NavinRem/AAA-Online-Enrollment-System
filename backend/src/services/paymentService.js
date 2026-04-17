const { db, COLLECTIONS } = require('../config/database')
const { validatePayment } = require('../validators/paymentValidator')

class PaymentService {
  async initiatePayment(paymentData) {
    const validatedData = validatePayment(paymentData)
    const paymentRef = db.collection(COLLECTIONS.PAYMENT).doc()

    await paymentRef.set(validatedData)
    return {
      transactionId: paymentRef.id,
      clientSecret: 'placeholder_secret_for_frontend',
      message: 'Payment initiated',
    }
  }


  async verifyPayment(transactionId) {
    const paymentRef = db.collection(COLLECTIONS.PAYMENT).doc(transactionId)
    const doc = await paymentRef.get()

    if (!doc.exists) throw new Error('Transaction not found')

    await paymentRef.update({
      status: 'completed',
      updatedAt: new Date().toISOString(),
    })

    const payment = doc.data()
    if (payment.enrollmentId) {
      const enrollmentRef = db
        .collection(COLLECTIONS.ENROLLMENT)
        .doc(payment.enrollmentId)
      await enrollmentRef.update({
        paymentStatus: 'paid',
        status: 'confirmed',
      })

      const enrollmentDoc = await enrollmentRef.get()
      const bId = enrollmentDoc.data()?.branchId
      if (bId) {
        const branchService = require('./branchService')
        await branchService.calculateAndSyncStats(bId)
      }
    }

    return { status: 'success', message: 'Payment verified' }
  }

  async getPaymentHistory(userId) {
    if (!userId) {
      throw new Error('User ID is required to fetch payment history')
    }

    const snapshot = await db
      .collection(COLLECTIONS.PAYMENT)
      .where('parentId', '==', userId)
      .get()

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  }

  async getAllPayments() {
    const snapshot = await db.collection(COLLECTIONS.PAYMENT).get()
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  }
}

module.exports = new PaymentService()

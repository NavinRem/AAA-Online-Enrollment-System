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

  async getAllPayments() {
    const snapshot = await db.collection(COLLECTIONS.PAYMENT).get()
    const payments = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    
    // To filter out deleted enrollments efficiently, we'd need a complex join or denormalization.
    // For now, we perform a post-query filter.
    const enrollmentIds = [...new Set(payments.map(p => p.enrollmentId).filter(Boolean))]
    
    if (enrollmentIds.length === 0) return payments

    // Fetch all related enrollments in chunks (Firestore limit is 30 for 'in' queries)
    const enrollmentMap = {}
    for (let i = 0; i < enrollmentIds.length; i += 30) {
      const chunk = enrollmentIds.slice(i, i + 30)
      const snap = await db.collection(COLLECTIONS.ENROLLMENT)
        .where('__name__', 'in', chunk)
        .get()
      snap.forEach(doc => {
        enrollmentMap[doc.id] = doc.data()
      })
    }

    return payments.filter(p => {
      if (!p.enrollmentId) return true
      const enrollment = enrollmentMap[p.enrollmentId]
      return enrollment && enrollment.isDeleted !== true
    })
  }

  async getPaymentHistory(uid) {
    if (!uid) {
      throw new Error('User ID is required to fetch payment history')
    }

    const [paymentsSnap, enrollmentsSnap] = await Promise.all([
      db.collection(COLLECTIONS.PAYMENT).where('parentId', '==', uid).get(),
      db.collection(COLLECTIONS.ENROLLMENT).where('parentId', '==', uid).get()
    ])

    const activeEnrollmentIds = new Set(
      enrollmentsSnap.docs
        .filter(doc => doc.data().isDeleted !== true)
        .map(doc => doc.id)
    )

    return paymentsSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter(p => !p.enrollmentId || activeEnrollmentIds.has(p.enrollmentId))
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
      const enrollmentDoc = await enrollmentRef.get()
      
      if (!enrollmentDoc.exists) {
        throw new Error('Linked enrollment not found')
      }
      
      const enrollmentData = enrollmentDoc.data()
      
      // Safety: Don't reactivate cancelled or deleted enrollments
      if (enrollmentData.status === 'cancelled' || enrollmentData.isDeleted) {
        throw new Error('Cannot verify payment: enrollment has been cancelled or deleted. Please create a new enrollment.')
      }
      
      // Safety: Check class capacity before re-activating
      if (enrollmentData.classId) {
        const classRef = db.collection(COLLECTIONS.CLASS).doc(enrollmentData.classId)
        const classDoc = await classRef.get()
        if (classDoc.exists) {
          const classData = classDoc.data()
          const isSeatTaking = (s) => ['active', 'confirmed', 'paid', 'unpaid'].includes(s)
          // Only check capacity if the enrollment wasn't already taking a seat
          if (!isSeatTaking(enrollmentData.status) && classData.currentCount >= classData.capacity) {
            throw new Error('Cannot verify payment: class is now full. Please contact admin.')
          }
        }
      }
      
      await enrollmentRef.update({
        paymentStatus: 'paid',
        status: 'paid',
      })

      const bId = enrollmentData.branchId
      if (bId) {
        const branchService = require('./branchService')
        await branchService.calculateAndSyncStats(bId)
      }
    }

    return { status: 'success', message: 'Payment verified' }
  }

  async getFinancialStats() {
    const snapshot = await db.collection(COLLECTIONS.ENROLLMENT).get()
    const enrollments = snapshot.docs
      .map((doc) => doc.data())
      .filter((e) => e.isDeleted !== true)

    let totalRevenue = 0
    let pendingRevenue = 0
    let paidCount = 0
    let totalCount = 0

    enrollments.forEach((data) => {
      // Skip if it doesn't have an amount (not a financial record)
      if (data.amount === undefined) return

      totalCount++
      const status = String(data.paymentStatus || data.status || 'unpaid').toLowerCase()
      const isPaid = ['paid', 'confirmed', 'active', 'success'].includes(status)

      if (isPaid) {
        totalRevenue += data.amount || 0
        paidCount++
      } else if (status === 'unpaid' || status === 'pending') {
        pendingRevenue += data.amount || 0
      }
    })

    return {
      totalRevenue,
      pendingRevenue,
      paidCount,
      totalCount,
      settledRatio:
        totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0,
      updatedAt: new Date().toISOString(),
    }
  }
}

module.exports = new PaymentService()

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
    const enrollmentIds = [
      ...new Set(payments.map((p) => p.enrollmentId).filter(Boolean)),
    ]

    if (enrollmentIds.length === 0) return payments

    // Fetch all related enrollments in chunks (Firestore limit is 30 for 'in' queries)
    const enrollmentMap = {}
    for (let i = 0; i < enrollmentIds.length; i += 30) {
      const chunk = enrollmentIds.slice(i, i + 30)
      const snap = await db
        .collection(COLLECTIONS.ENROLLMENT)
        .where('__name__', 'in', chunk)
        .get()
      snap.forEach((doc) => {
        enrollmentMap[doc.id] = doc.data()
      })
    }

    return payments
      .filter((p) => {
        if (!p.enrollmentId) return true
        const enrollment = enrollmentMap[p.enrollmentId]
        return enrollment && enrollment.isDeleted !== true
      })
      .map((p) => {
        const enrollment = enrollmentMap[p.enrollmentId] || {}
        return {
          ...p,
          // Inject enrollment snapshots if missing in payment record
          student: p.student || enrollment.student,
          parent: p.parent || enrollment.parent,
          program: p.program || enrollment.program,
          class: p.class || enrollment.class,
          termStatus:
            p.class?.term?.status ||
            enrollment.class?.term?.status ||
            'unknown',
        }
      })
  }

  async getPaymentHistory(uid) {
    if (!uid) {
      throw new Error('User ID is required to fetch payment history')
    }

    const [paymentsSnap, enrollmentsSnap] = await Promise.all([
      db.collection(COLLECTIONS.PAYMENT).where('parentId', '==', uid).get(),
      db.collection(COLLECTIONS.ENROLLMENT).where('parentId', '==', uid).get(),
    ])

    const activeEnrollmentIds = new Set(
      enrollmentsSnap.docs
        .filter((doc) => doc.data().isDeleted !== true)
        .map((doc) => doc.id),
    )

    return paymentsSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((p) => !p.enrollmentId || activeEnrollmentIds.has(p.enrollmentId))
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
        throw new Error(
          'Cannot verify payment: enrollment has been cancelled or deleted. Please create a new enrollment.',
        )
      }

      // Safety: Check class capacity before re-activating
      if (enrollmentData.classId) {
        const classRef = db
          .collection(COLLECTIONS.CLASS)
          .doc(enrollmentData.classId)
        const classDoc = await classRef.get()
        if (classDoc.exists) {
          const classData = classDoc.data()
          const isSeatTaking = (s) =>
            ['active', 'confirmed', 'paid', 'unpaid'].includes(s)
          // Only check capacity if the enrollment wasn't already taking a seat
          if (
            !isSeatTaking(enrollmentData.status) &&
            classData.currentCount >= classData.capacity
          ) {
            throw new Error(
              'Cannot verify payment: class is now full. Please contact admin.',
            )
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
    const [enrollSnap, paymentSnap, termSnap, classSnap] = await Promise.all([
      db
        .collection(COLLECTIONS.ENROLLMENT)
        .where('isDeleted', '!=', true)
        .get(),
      db.collection(COLLECTIONS.PAYMENT).get(),
      db.collection(COLLECTIONS.TERM).where('status', '==', 'active').get(),
      db.collection(COLLECTIONS.CLASS).get(),
    ])

    const activeTermIds = new Set(termSnap.docs.map((doc) => doc.id))
    const activeClassIds = new Set(
      classSnap.docs
        .filter((doc) => activeTermIds.has(doc.data().termId))
        .map((doc) => doc.id),
    )

    const enrollmentToClassMap = {}
    enrollSnap.forEach((doc) => {
      enrollmentToClassMap[doc.id] = doc.data().classId
    })

    const enrollments = enrollSnap.docs.map((doc) => doc.data())
    const payments = paymentSnap.docs.map((doc) => doc.data())

    // 1. Settled Stats (From Payments Collection, filtered by Active Term Classes)
    let totalPaidRevenue = 0
    let paidCount = 0
    let cashRevenue = 0
    let cashCount = 0
    let onlineRevenue = 0
    let onlineCount = 0

    payments.forEach((p) => {
      const classId =
        p.classId ||
        (p.enrollmentId ? enrollmentToClassMap[p.enrollmentId] : null)
      if (!activeClassIds.has(classId)) return

      const amount = Number(p.amount) || 0
      totalPaidRevenue += amount
      paidCount++

      if (String(p.paymentMethod).toLowerCase() === 'cash') {
        cashRevenue += amount
        cashCount++
      } else {
        onlineRevenue += amount
        onlineCount++
      }
    })

    // 2. Outstanding Stats (From Enrollments Collection, filtered by Active Term Classes)
    let pendingRevenue = 0
    let pendingCount = 0
    let totalEnrollments = 0

    enrollments.forEach((e) => {
      if (!activeClassIds.has(e.classId)) return

      totalEnrollments++
      const status = String(
        e.paymentStatus || e.status || 'unpaid',
      ).toLowerCase()
      if (['unpaid', 'pending'].includes(status)) {
        pendingRevenue += Number(e.amount) || 0
        pendingCount++
      }
    })

    return {
      totalPaidRevenue,
      paidCount,
      cashRevenue,
      cashCount,
      onlineRevenue,
      onlineCount,
      pendingRevenue,
      pendingCount,
      totalEnrollments,
      settledRatio:
        totalEnrollments > 0
          ? Math.round((paidCount / totalEnrollments) * 100)
          : 0,
      updatedAt: new Date().toISOString(),
    }
  }
}

module.exports = new PaymentService()

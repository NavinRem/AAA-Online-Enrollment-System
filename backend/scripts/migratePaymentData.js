require('dotenv').config()
const { db, COLLECTIONS } = require('../src/config/database')

async function migratePayments() {
  console.log('Starting payment data migration...')

  try {
    const paymentsSnapshot = await db.collection(COLLECTIONS.PAYMENT).get()
    const enrollmentsSnapshot = await db.collection(COLLECTIONS.ENROLLMENT).get()

    let updatedPayments = 0
    let updatedEnrollments = 0

    // 1. Migrate Payments
    const paymentBatch = db.batch()
    paymentsSnapshot.docs.forEach((doc) => {
      const data = doc.data()
      const isCash = String(data.paymentMethod || 'cash').toLowerCase() === 'cash'
      let needsUpdate = false
      const updates = {}

      if (isCash && data.transactionId && !data.receiptId) {
        updates.receiptId = data.transactionId
        updates.transactionId = ''
        needsUpdate = true
      } else if (!isCash && !data.receiptId && data.enrollmentId) {
        updates.receiptId = `#${data.enrollmentId.slice(-6)}`
        needsUpdate = true
      }

      if (needsUpdate) {
        paymentBatch.update(doc.ref, updates)
        updatedPayments++
      }
    })

    // 2. Migrate Enrollments
    const enrollmentBatch = db.batch()
    enrollmentsSnapshot.docs.forEach((doc) => {
      const data = doc.data()
      const isCash = String(data.paymentMethod || 'cash').toLowerCase() === 'cash'
      let needsUpdate = false
      const updates = {}

      if (isCash && data.transactionId && !data.receiptId) {
        updates.receiptId = data.transactionId
        updates.transactionId = ''
        needsUpdate = true
      } else if (!isCash && data.transactionId && !data.receiptId && doc.id) {
        updates.receiptId = `#${doc.id.slice(-6)}`
        needsUpdate = true
      }

      if (needsUpdate) {
        enrollmentBatch.update(doc.ref, updates)
        updatedEnrollments++
      }
    })

    if (updatedPayments > 0) {
      await paymentBatch.commit()
      console.log(`Successfully migrated ${updatedPayments} payment records.`)
    } else {
      console.log('No payment records needed migration.')
    }

    if (updatedEnrollments > 0) {
      await enrollmentBatch.commit()
      console.log(`Successfully migrated ${updatedEnrollments} enrollment records.`)
    } else {
      console.log('No enrollment records needed migration.')
    }

    console.log('Migration completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

migratePayments()

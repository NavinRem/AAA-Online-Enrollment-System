const { db, COLLECTIONS } = require('../config/database')
const profileHelper = require('../utils/profileHelper')

const SEAT_TAKING_STATUSES = [
  'active',
  'confirmed',
  'paid',
  'unpaid',
  'success',
]
const isSeatTaking = (status) =>
  SEAT_TAKING_STATUSES.includes(String(status || '').toLowerCase())

class EnrollmentService {
  async createEnrollment(enrollmentData) {
    const { studentId, programId, classId } = enrollmentData

    if (!studentId || !programId || !classId) {
      throw new Error('studentId, programId, and classId are required')
    }

    const [studentDoc, programDoc, classDoc] = await Promise.all([
      db.collection(COLLECTIONS.STUDENT).doc(studentId).get(),
      db.collection(COLLECTIONS.PROGRAM).doc(programId).get(),
      db.collection(COLLECTIONS.CLASS).doc(classId).get(),
    ])

    if (!studentDoc.exists) throw new Error('Student not found')
    if (!programDoc.exists) throw new Error('Program not found')
    if (!classDoc.exists) throw new Error('Class not found')

    const classData = classDoc.data()
    const capacity = classData.capacity || classData.maxCapacity || 0
    const currentCount = classData.currentCount || classData.enrolledCount || 0
    
    // Check for archived status or expired term
    if (
      classData.term?.endDate &&
      new Date(classData.term.endDate) < new Date()
    ) {
      throw new Error(
        'Cannot enroll in a class that has already ended (Archived).',
      )
    }

    if (capacity > 0 && currentCount >= capacity) {
      throw new Error('Class is full')
    }

    const existingEnrollment = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where('studentId', '==', studentId)
      .where('classId', '==', classId)
      .get()

    const activeNonDeleted = existingEnrollment.docs.filter((doc) => {
      const data = doc.data()
      return data.isDeleted !== true && !['cancelled', 'deleted'].includes(String(data.status).toLowerCase())
    })

    if (activeNonDeleted.length > 0) {
      throw new Error('Student already enrolled for this class')
    }

    const studentSnapshot = profileHelper.getStudentSnapshot(
      studentId,
      studentDoc.data(),
    )
    const programSnapshot = profileHelper.getProgramSnapshot(
      programId,
      programDoc.data(),
    )
    const classSnapshot = profileHelper.getClassSnapshot(classId, classData)

    let parentSnapshot = null
    const parentId = studentDoc.data().parentId
    if (parentId) {
      const parentDoc = await db
        .collection(COLLECTIONS.PARENT)
        .doc(parentId)
        .get()
      if (parentDoc.exists) {
        parentSnapshot = profileHelper.getParentSnapshot(
          parentId,
          parentDoc.data(),
        )
      }
    }

    const enrollmentId = db.collection(COLLECTIONS.ENROLLMENT).doc().id

    // Cleanup redundant names from root if sent from frontend
    const cleanEnrollmentData = { ...enrollmentData }
    const redundantFields = [
      'studentName',
      'parentName',
      'programName',
      'className',
      'termName',
    ]
    redundantFields.forEach((f) => delete cleanEnrollmentData[f])

    const newEnrollment = {
      ...cleanEnrollmentData,
      parentId: parentId,
      student: studentSnapshot,
      parent: parentSnapshot,
      program: programSnapshot,
      class: classSnapshot,
      status: enrollmentData.status || 'unpaid',
      paymentStatus: enrollmentData.paymentStatus || 'unpaid',
      enrollmentDate: enrollmentData.enrollAt || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await db.runTransaction(async (transaction) => {
      transaction.set(
        db.collection(COLLECTIONS.ENROLLMENT).doc(enrollmentId),
        newEnrollment,
      )

      if (isSeatTaking(newEnrollment.status)) {
        const admin = require('firebase-admin')
        const studentCompact = {
          id: studentId,
          name: studentSnapshot.name,
          profileURL: studentSnapshot.profileURL,
          enrolledAt: newEnrollment.createdAt,
        }

        transaction.update(db.collection(COLLECTIONS.CLASS).doc(classId), {
          currentCount: currentCount + 1,
          studentIds: admin.firestore.FieldValue.arrayUnion(studentId),
          students: admin.firestore.FieldValue.arrayUnion(studentCompact),
        })

        transaction.update(db.collection(COLLECTIONS.PROGRAM).doc(programId), {
          totalEnrolledCount: admin.firestore.FieldValue.increment(1),
        })
      }

      // Automatic Payment Record Creation
      if (newEnrollment.paymentStatus === 'paid') {
        const paymentRef = db.collection(COLLECTIONS.PAYMENT).doc()
        transaction.set(paymentRef, {
          enrollmentId,
          studentId: studentId,
          parentId: parentId,
          student: studentSnapshot,
          parent: parentSnapshot,
          program: programSnapshot,
          amount: Number(newEnrollment.amount) || 0,
          paymentMethod: (newEnrollment.paymentMethod || 'cash').toLowerCase(),
          paymentStatus: 'paid',
          paidAt: newEnrollment.paidAt || newEnrollment.createdAt,
          createdAt: newEnrollment.createdAt,
          updatedAt: newEnrollment.updatedAt,
          remark: 'Automatically created during enrollment'
        })
      }
    })

    // Background task: Mark trials as successful
    this.markMatchingTrialsAsSuccessful(newEnrollment).catch((error) =>
      console.error('Failed to sync trial success:', error),
    )

    return { id: enrollmentId, ...newEnrollment }
  }

  async getAllEnrollments(filters = {}) {
    let query = db.collection(COLLECTIONS.ENROLLMENT)

    // 1. Filtering (Only basic Firestore filters to avoid index issues)
    if (filters.studentId && filters.studentId !== 'undefined')
      query = query.where('studentId', '==', filters.studentId)
    if (filters.classId && filters.classId !== 'undefined')
      query = query.where('classId', '==', filters.classId)

    // Intelligent Status/PaymentStatus handling
    if (
      filters.status &&
      filters.status !== 'undefined' &&
      filters.status !== 'all'
    ) {
      const statusLower = filters.status.toLowerCase()
      // Enhanced mapping for all valid payment and operational statuses
      if (
        [
          'paid',
          'unpaid',
          'pending',
          'confirmed',
          'success',
          'active',
          'cancelled',
        ].includes(statusLower)
      ) {
        // If it's a payment status, we can filter by paymentStatus field
        query = query.where('paymentStatus', '==', statusLower)
      } else {
        query = query.where('status', '==', statusLower)
      }
    }

    if (filters.paymentStatus && filters.paymentStatus !== 'undefined') {
      query = query.where(
        'paymentStatus',
        '==',
        filters.paymentStatus.toLowerCase(),
      )
    }

    const snapshot = await query.get()

    // 2. Map and Filter by isDeleted in-memory (Foolproof)
    let data = snapshot.docs
      .map((doc) => profileHelper.ensureFreshAge({ id: doc.id, ...doc.data() }))
      .filter((e) => e.isDeleted !== true)

    const total = data.length

    // 4. Sort and Paginate in-memory
    const orderBy = filters.orderBy || 'createdAt'
    const orderDir = filters.orderDir || 'desc'
    data.sort((a, b) => {
      const valA = a[orderBy] || ''
      const valB = b[orderBy] || ''
      if (orderDir === 'desc') return valB > valA ? 1 : -1
      return valA > valB ? 1 : -1
    })

    // Manual Pagination
    const page = parseInt(filters.page) || 1
    const limit = parseInt(filters.limit) || 50
    const offset = (page - 1) * limit
    const paginatedData = data.slice(offset, offset + limit)

    return {
      data: paginatedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async getEnrollment(id) {
    const doc = await db.collection(COLLECTIONS.ENROLLMENT).doc(id).get()
    if (!doc.exists) throw new Error('Enrollment not found')
    const data = profileHelper.ensureFreshAge({ id: doc.id, ...doc.data() })
    if (data.isDeleted) throw new Error('Enrollment has been deleted')
    return data
  }

  async updateEnrollment(id, updateData) {
    const ref = db.collection(COLLECTIONS.ENROLLMENT).doc(id)

    return await db.runTransaction(async (transaction) => {
      const admin = require('firebase-admin')
      const doc = await transaction.get(ref)
      if (!doc.exists) throw new Error('Enrollment not found')

      const currentData = doc.data()

      const updates = { ...updateData }

      // Re-fetch snapshots if critical IDs changed
      if (
        updateData.studentId &&
        updateData.studentId !== currentData.studentId
      ) {
        const sDoc = await transaction.get(
          db.collection(COLLECTIONS.STUDENT).doc(updateData.studentId),
        )
        if (sDoc.exists) {
          updates.student = profileHelper.getStudentSnapshot(
            updateData.studentId,
            sDoc.data(),
          )
          updates.parentId = sDoc.data().parentId // Sync parentId too

          const pDoc = await transaction.get(
            db.collection(COLLECTIONS.PARENT).doc(updates.parentId),
          )
          if (pDoc.exists) {
            updates.parent = profileHelper.getParentSnapshot(
              updates.parentId,
              pDoc.data(),
            )
          }
        }
      }

      if (
        updateData.programId &&
        updateData.programId !== currentData.programId
      ) {
        const pDoc = await transaction.get(
          db.collection(COLLECTIONS.PROGRAM).doc(updateData.programId),
        )
        if (pDoc.exists) {
          updates.program = profileHelper.getProgramSnapshot(
            updateData.programId,
            pDoc.data(),
          )
        }
      }

      if (updateData.classId && updateData.classId !== currentData.classId) {
        const admin = require('firebase-admin')
        const oldClassRef = db.collection(COLLECTIONS.CLASS).doc(currentData.classId)
        const newClassRef = db.collection(COLLECTIONS.CLASS).doc(updateData.classId)
        
        const [oldClassDoc, newClassDoc] = await Promise.all([
          transaction.get(oldClassRef),
          transaction.get(newClassRef)
        ])

        if (oldClassDoc.exists) {
          const oldData = oldClassDoc.data()
          const updatedStudents = (oldData.students || []).filter(s => s.id !== currentData.studentId)
          transaction.update(oldClassRef, {
            currentCount: admin.firestore.FieldValue.increment(-1),
            studentIds: admin.firestore.FieldValue.arrayRemove(currentData.studentId),
            students: updatedStudents
          })
        }

        if (newClassDoc.exists) {
          const newData = newClassDoc.data()
          const studentSnapshot = {
            id: currentData.studentId,
            name: currentData.student?.name || 'Unknown',
            profileURL: currentData.student?.profileURL || null,
            enrolledAt: currentData.createdAt || new Date().toISOString()
          }
          transaction.update(newClassRef, {
            currentCount: admin.firestore.FieldValue.increment(1),
            studentIds: admin.firestore.FieldValue.arrayUnion(currentData.studentId),
            students: admin.firestore.FieldValue.arrayUnion(studentSnapshot)
          })
          
          updates.class = profileHelper.getClassSnapshot(updateData.classId, newData)
        }
      }

      // Ensure we don't have redundant top-level name fields (Cleanup legacy data if any)
      const redundantFields = [
        'studentName',
        'parentName',
        'programName',
        'className',
        'termName',
      ]
      redundantFields.forEach((f) => {
        if (currentData[f] !== undefined)
          updates[f] = admin.firestore.FieldValue.delete()
      })

      // Sync status with paymentStatus if updated
      if (updateData.paymentStatus && updateData.paymentStatus !== currentData.paymentStatus) {
        if (updateData.paymentStatus === 'paid') {
          updates.status = 'paid'
        } else if (['unpaid', 'pending', 'failed'].includes(updateData.paymentStatus)) {
          updates.status = 'unpaid'
        }
      }

      transaction.update(ref, updates)
 
      // Automatic Payment Record Creation on Status Transition
      if (updateData.paymentStatus === 'paid' && currentData.paymentStatus !== 'paid') {
        const paymentRef = db.collection(COLLECTIONS.PAYMENT).doc()
        transaction.set(paymentRef, {
          enrollmentId: id,
          studentId: currentData.studentId,
          parentId: currentData.parentId,
          student: currentData.student,
          parent: currentData.parent,
          program: currentData.program,
          amount: Number(updateData.amount || currentData.amount) || 0,
          paymentMethod: (updateData.paymentMethod || currentData.paymentMethod || 'cash').toLowerCase(),
          paymentStatus: 'paid',
          paidAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          remark: 'Automatically created during enrollment update'
        })
      }

      // Capacity & Student Seat tracking logic
      if (updateData.status && currentData.status !== updateData.status) {
        const classRef = db
          .collection(COLLECTIONS.CLASS)
          .doc(currentData.classId)
        const classDoc = await transaction.get(classRef)
        if (classDoc.exists) {
          const classData = classDoc.data()
          const admin = require('firebase-admin')
          let newCount = classData.currentCount || classData.enrolledCount || 0
          
          if (
            isSeatTaking(updateData.status) &&
            !isSeatTaking(currentData.status)
          ) {
            newCount = newCount + 1
            const studentCompact = {
              id: currentData.studentId,
              name: currentData.student?.name || 'Unknown',
              profileURL: currentData.student?.profileURL || null,
              enrolledAt: new Date().toISOString(),
            }
            transaction.update(classRef, {
              currentCount: newCount,
              studentIds: admin.firestore.FieldValue.arrayUnion(
                currentData.studentId,
              ),
              students: admin.firestore.FieldValue.arrayUnion(studentCompact),
            })
            // Update Program total count
            transaction.update(db.collection(COLLECTIONS.PROGRAM).doc(currentData.programId), {
              totalEnrolledCount: admin.firestore.FieldValue.increment(1),
            })
          } else if (
            !isSeatTaking(updateData.status) &&
            isSeatTaking(currentData.status)
          ) {
            newCount = Math.max(0, newCount - 1)

            const updatedStudents = (classData.students || []).filter(
              (s) => s.id !== currentData.studentId,
            )

            transaction.update(classRef, {
              currentCount: newCount,
              studentIds: admin.firestore.FieldValue.arrayRemove(
                currentData.studentId,
              ),
              students: updatedStudents,
            })
            // Update Program total count
            transaction.update(db.collection(COLLECTIONS.PROGRAM).doc(currentData.programId), {
              totalEnrolledCount: admin.firestore.FieldValue.increment(-1),
            })
          }
        }
      }

      return { id, ...updateData }
    })
  }

  async deleteEnrollment(id) {
    const enrollmentRef = db.collection(COLLECTIONS.ENROLLMENT).doc(id)
    const enrollmentDoc = await enrollmentRef.get()
    if (!enrollmentDoc.exists) throw new Error('Enrollment not found')

    const { classId, status } = enrollmentDoc.data()

    await db.runTransaction(async (transaction) => {
      transaction.update(enrollmentRef, {
        isDeleted: true,
        status: 'deleted',
        updatedAt: new Date().toISOString(),
      })
      if (isSeatTaking(status)) {
        const classRef = db.collection(COLLECTIONS.CLASS).doc(classId)
        const classDoc = await transaction.get(classRef)
        if (classDoc.exists) {
          const classData = classDoc.data()
          const currentCount = classData.currentCount || classData.enrolledCount || 0
          const updatedStudents = (classData.students || []).filter(
            (s) => s.id !== enrollmentDoc.data().studentId,
          )
          const admin = require('firebase-admin')
          transaction.update(classRef, {
            currentCount: Math.max(0, currentCount - 1),
            studentIds: admin.firestore.FieldValue.arrayRemove(
              enrollmentDoc.data().studentId,
            ),
            students: updatedStudents,
          })
          transaction.update(db.collection(COLLECTIONS.PROGRAM).doc(enrollmentDoc.data().programId), {
            totalEnrolledCount: admin.firestore.FieldValue.increment(-1),
          })
        }
      }
    })

    return { message: 'Enrollment deleted successfully (Soft delete)' }
  }

  // --- Specialized Actions & Syncing ---

  async cancelEnrollment(id) {
    const enrollmentRef = db.collection(COLLECTIONS.ENROLLMENT).doc(id)
    const enrollmentDoc = await enrollmentRef.get()
    if (!enrollmentDoc.exists) throw new Error('Enrollment not found')

    const { classId, status } = enrollmentDoc.data()

    if (!isSeatTaking(status))
      throw new Error(
        'Only active, confirmed, paid, or unpaid enrollments can be cancelled',
      )

    await db.runTransaction(async (transaction) => {
      transaction.update(enrollmentRef, {
        status: 'cancelled',
        paymentStatus: 'cancelled',
        cancelledAt: new Date().toISOString(),
      })
      if (isSeatTaking(status)) {
        const classRef = db.collection(COLLECTIONS.CLASS).doc(classId)
        const classDoc = await transaction.get(classRef)
        if (classDoc.exists) {
          const classData = classDoc.data()
          const currentCount = classData.currentCount || classData.enrolledCount || 0
          const updatedStudents = (classData.students || []).filter(
            (s) => s.id !== enrollmentDoc.data().studentId,
          )
          const admin = require('firebase-admin')
          transaction.update(classRef, {
            currentCount: Math.max(0, currentCount - 1),
            studentIds: admin.firestore.FieldValue.arrayRemove(
              enrollmentDoc.data().studentId,
            ),
            students: updatedStudents,
          })
          transaction.update(db.collection(COLLECTIONS.PROGRAM).doc(enrollmentDoc.data().programId), {
            totalEnrolledCount: admin.firestore.FieldValue.increment(-1),
          })
        }
      }
    })

    return { message: 'Enrollment cancelled successfully' }
  }

  async getStudentEligibility(studentId, programId) {
    const existing = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where('studentId', '==', studentId)
      .where('programId', '==', programId)
      .get()

    const activeNonDeleted = existing.docs.filter((doc) => {
      const data = doc.data()
      return data.isDeleted !== true && !['cancelled', 'deleted'].includes(String(data.status).toLowerCase())
    })

    return {
      isEligible: activeNonDeleted.length === 0,
      reason:
        activeNonDeleted.length === 0
          ? null
          : 'Already enrolled in this program',
    }
  }

  async syncEnrollmentsWithClass(classId, classSnapshot) {
    const snapshot = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where('classId', '==', classId)
      .get()

    if (snapshot.empty) return

    const firestoreHelper = require('../utils/firestoreHelper')
    const writes = snapshot.docs.map((doc) => ({
      ref: doc.ref,
      data: { class: classSnapshot },
    }))
    await firestoreHelper.chunkedUpdate(writes)
  }

  async syncEnrollmentsWithProgram(programId, programSnapshot) {
    const snapshot = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where('programId', '==', programId)
      .get()

    if (snapshot.empty) return

    const firestoreHelper = require('../utils/firestoreHelper')
    const writes = snapshot.docs.map((doc) => ({
      ref: doc.ref,
      data: { program: programSnapshot },
    }))
    await firestoreHelper.chunkedUpdate(writes)
  }

  async processPayment(enrollmentId, paymentData) {
    const { paymentMethod, bankName, amount, transactionId, remark } = paymentData
    const enrollmentRef = db.collection(COLLECTIONS.ENROLLMENT).doc(enrollmentId)

    return await db.runTransaction(async (transaction) => {
      const enrollmentDoc = await transaction.get(enrollmentRef)
      if (!enrollmentDoc.exists) throw new Error('Enrollment not found')

      const enrollmentData = enrollmentDoc.data()
      if (enrollmentData.status === 'paid' && paymentData.paymentStatus === 'paid') {
        throw new Error('Enrollment is already paid')
      }

      const pStatus = paymentData.paymentStatus || 'paid'
      const eStatus = pStatus === 'paid' ? 'paid' : 'unpaid'
      const now = new Date().toISOString()

      // 1. Update Enrollment
      transaction.update(enrollmentRef, {
        paymentStatus: pStatus.toLowerCase(),
        status: eStatus.toLowerCase(),
        updatedAt: now,
        paidAt: pStatus === 'paid' ? now : null,
        paymentMethod: paymentMethod === 'cash' ? 'cash' : (bankName ? bankName.toLowerCase() : 'online'),
        transactionId: transactionId || '',
      })

      // 2. Create Payment Record
      const paymentRef = db.collection(COLLECTIONS.PAYMENT).doc()
      transaction.set(paymentRef, {
        enrollmentId,
        studentId: enrollmentData.studentId,
        parentId: enrollmentData.parentId,
        student: enrollmentData.student,
        parent: enrollmentData.parent,
        program: enrollmentData.program,
        amount: amount || enrollmentData.amount || 0,
        paymentMethod: paymentMethod.toLowerCase(),
        bankName: paymentMethod === 'online' ? (bankName ? bankName.toLowerCase() : 'online') : null,
        transactionId: transactionId || '',
        paymentStatus: pStatus.toLowerCase(),
        remark: remark || '',
        paidAt: now,
        createdAt: now,
      })

      return { success: true, paymentId: paymentRef.id, enrollmentStatus: eStatus }
    })
  }

  async markMatchingTrialsAsSuccessful(enrollment) {
    const { studentId, student, programId } = enrollment
    const trialsRef = db.collection(COLLECTIONS.TRIAL)

    // 1. Check by studentId (for booked trials)
    const bookedQuery = await trialsRef
      .where('studentId', '==', studentId)
      .where('programId', '==', programId)
      .where('isSuccessful', '==', false)
      .get()

    // 2. Check by name (for walk-in trials that converted)
    const walkinQuery = await trialsRef
      .where('isGuest', '==', true)
      .where('guestStudentName', '==', student.name)
      .where('programId', '==', programId)
      .where('isSuccessful', '==', false)
      .get()

    const batch = db.batch()
    bookedQuery.docs.forEach((doc) => {
      batch.update(doc.ref, {
        isSuccessful: true,
        updatedAt: new Date().toISOString(),
      })
    })
    walkinQuery.docs.forEach((doc) => {
      batch.update(doc.ref, {
        isSuccessful: true,
        updatedAt: new Date().toISOString(),
      })
    })

    if (!bookedQuery.empty || !walkinQuery.empty) {
      await batch.commit()
    }
  }
}

module.exports = new EnrollmentService()

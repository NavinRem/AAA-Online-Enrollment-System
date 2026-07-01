const { db, COLLECTIONS } = require('../config/database')
const { FieldValue } = require('firebase-admin/firestore')
const profileHelper = require('../utils/profileHelper')
const {
  validateEnrollment,
  validateUpdateEnrollment,
} = require('../validators/enrollmentValidator')

const SEAT_TAKING_STATUSES = [
  'confirmed',
  'paid',
  'success',
  'active',
]
const isSeatTaking = (status) =>
  SEAT_TAKING_STATUSES.includes(String(status || '').toLowerCase())

class EnrollmentService {
  async createEnrollment(enrollmentData) {
    const validated = validateEnrollment(enrollmentData)
    const { studentId, programId, classId, termId, termOfferingId } = validated

    const [studentDoc, programDoc, classDoc] = await Promise.all([
      db.collection(COLLECTIONS.STUDENT).doc(studentId).get(),
      db.collection(COLLECTIONS.PROGRAM).doc(programId).get(),
      db.collection(COLLECTIONS.CLASS).doc(classId).get(),
    ])

    if (!studentDoc.exists) throw new Error('Student not found')
    if (!programDoc.exists) throw new Error('Program not found')
    if (!classDoc.exists) throw new Error('Class not found')

    const termService = require('./termService')
    const { term, offering } = await termService.getOffering(
      termId,
      termOfferingId,
    )
    if (offering.classId !== classId && offering.program?.id !== programId) {
      throw new Error(
        'Selected term offering does not match the selected class/program',
      )
    }
    if (term.endDate && new Date(term.endDate) < new Date()) {
      throw new Error(
        'Cannot enroll in a term offering that has already ended.',
      )
    }

    const existingEnrollment = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where('studentId', '==', studentId)
      .where('termOfferingId', '==', termOfferingId)
      .get()

    const activeNonDeleted = existingEnrollment.docs.filter((doc) => {
      const data = doc.data()
      return (
        data.isDeleted !== true &&
        !['cancelled', 'deleted'].includes(String(data.status).toLowerCase())
      )
    })

    if (activeNonDeleted.length > 0) {
      throw new Error('Student already enrolled for this term offering')
    }

    const scheduleCapacity =
      offering.schedule?.capacity ||
      offering.capacity ||
      classDoc.data().program?.capacity ||
      20
    if ((offering.currentCount || 0) >= scheduleCapacity) {
      throw new Error(
        `This schedule is full. Maximum capacity of ${scheduleCapacity} reached.`,
      )
    }

    
    const termSnapshot = termService.getTermSnapshot(termId, term, offering)
    const classSnapshot = profileHelper.getClassSnapshot(classId, {
      ...classDoc.data(),
      program:
        offering.program ||
        profileHelper.getProgramSnapshot(programId, programDoc.data()),
      branch: offering.branch,
      schedule: offering.schedule,
      term: termSnapshot,
      status: offering.status || 'active',
    })

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

    const cleanEnrollmentData = { ...validated }
    const redundantFields = [
      'studentName',
      'parentName',
      'programName',
      'className',
      'termName',
    ]
    redundantFields.forEach((f) => delete cleanEnrollmentData[f])

    const studentSnapshot = profileHelper.getStudentSnapshot(
      studentId,
      studentDoc.data(),
    )
    const programSnapshot = profileHelper.getProgramSnapshot(
      programId,
      programDoc.data(),
    )
    const newEnrollment = {
      ...cleanEnrollmentData,
      parentId: parentId,
      student: studentSnapshot,
      parent: parentSnapshot,
      program: programSnapshot,
      class: classSnapshot,
      term: termSnapshot,
      status: validated.status || 'unpaid',
      paymentStatus: validated.paymentStatus || 'unpaid',
      amount: Number(validated.amount) || 0,
      enrollmentDate: validated.enrollAt || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
    }

    await db.runTransaction(async (transaction) => {
      transaction.set(
        db.collection(COLLECTIONS.ENROLLMENT).doc(enrollmentId),
        newEnrollment,
      )

      if (isSeatTaking(newEnrollment.status)) {
        transaction.update(db.collection(COLLECTIONS.PROGRAM).doc(programId), {
          totalEnrolledCount: FieldValue.increment(1),
        })
      }

      // Save enrolled branch and set status to Active after student enrolls
      if (offering.branchId) {
        transaction.update(
          db.collection(COLLECTIONS.STUDENT).doc(studentId),
          {
            branchId: offering.branchId,
            branchInfo: offering.branch || null,
            status: 'Active',
            updatedAt: new Date().toISOString(),
          },
        )
      } else {
        transaction.update(
          db.collection(COLLECTIONS.STUDENT).doc(studentId),
          {
            status: 'Active',
            updatedAt: new Date().toISOString(),
          },
        )
      }
      
      // Also ensure parent is Active
      if (parentId) {
        transaction.update(db.collection(COLLECTIONS.PARENT).doc(parentId), {
          status: 'Active',
          updatedAt: new Date().toISOString(),
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
          transactionId: newEnrollment.transactionId || '',
          receiptId: newEnrollment.receiptId || '',
          paymentStatus: 'paid',
          paidAt: newEnrollment.paidAt || newEnrollment.createdAt,
          createdAt: newEnrollment.createdAt,
          updatedAt: newEnrollment.updatedAt,
          remark: 'Automatically created during enrollment',
        })
      }
    })

    if (isSeatTaking(newEnrollment.status)) {
      await termService.syncOfferingStudent(
        termId,
        termOfferingId,
        { id: enrollmentId, ...newEnrollment },
        'upsert',
      )
    }

    // Background task: Mark trials as successful
    // Trigger the background task without 'await', so it runs silently
    this.markMatchingTrialsAsSuccessful(newEnrollment).catch((error) =>
      console.error('Failed to sync trial success:', error),
    )

    // Instantly return success to the frontend
    return { id: enrollmentId, ...newEnrollment }
  }

  async getAllEnrollments(filters = {}) {
    let query = db.collection(COLLECTIONS.ENROLLMENT)

    // Filtering (Only basic Firestore filters to avoid index issues)
    if (filters.studentId && filters.studentId !== 'undefined')
      query = query.where('studentId', '==', filters.studentId)
    if (filters.parentId && filters.parentId !== 'undefined')
      query = query.where('parentId', '==', filters.parentId)
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

    // Map and Filter by isDeleted in-memory (Foolproof)
    let data = snapshot.docs
      .map((doc) => profileHelper.ensureFreshAge({ id: doc.id, ...doc.data() }))
      .filter((e) => e.isDeleted !== true)

    // Sort and Paginate in-memory
    const orderBy = filters.orderBy || 'createdAt'
    const orderDir = filters.orderDir || 'desc'
    data.sort((a, b) => {
      let valA = a[orderBy] || ''
      let valB = b[orderBy] || ''

      // Handle numeric sorting for status and paymentStatus
      const isNumericField = ['status', 'paymentStatus'].includes(orderBy)
      if (isNumericField) {
        valA = parseInt(valA) || 0
        valB = parseInt(valB) || 0
      }

      if (orderDir === 'desc') return valB > valA ? 1 : -1
      return valA > valB ? 1 : -1
    })

    // Manual Pagination
    const page = parseInt(filters.page) || 1
    const limit = parseInt(filters.limit) || 50
    const offset = (page - 1) * limit
    const paginatedData = data.slice(offset, offset + limit)

    const total = data.length

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
    const beforeDoc = await ref.get()
    if (!beforeDoc.exists) throw new Error('Enrollment not found')
    const beforeData = beforeDoc.data()

    const result = await db.runTransaction(async (transaction) => {
      const validated = validateUpdateEnrollment(updateData)
      const doc = await transaction.get(ref)
      if (!doc.exists) throw new Error('Enrollment not found')

      const currentData = doc.data()

      const updates = { ...validated }

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

      if (
        (validated.termId && validated.termId !== currentData.termId) ||
        (validated.termOfferingId &&
          validated.termOfferingId !== currentData.termOfferingId) ||
        (validated.classId && validated.classId !== currentData.classId)
      ) {
        const termService = require('./termService')
        const nextTermId = validated.termId || currentData.termId
        const nextOfferingId =
          validated.termOfferingId || currentData.termOfferingId
        const nextClassId = validated.classId || currentData.classId
        const { term, offering } = await termService.getOffering(
          nextTermId,
          nextOfferingId,
        )
        updates.term = termService.getTermSnapshot(nextTermId, term, offering)
        updates.class = profileHelper.getClassSnapshot(nextClassId, {
          program: offering.program,
          branch: offering.branch,
          schedule: offering.schedule,
          term: updates.term,
          status: offering.status || 'active',
        })

        // Sync student branch if it changed
        if (offering.branchId) {
          transaction.update(
            db.collection(COLLECTIONS.STUDENT).doc(currentData.studentId),
            {
              branchId: offering.branchId,
              branchInfo: offering.branch || null,
              updatedAt: new Date().toISOString(),
            },
          )
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
        if (currentData[f] !== undefined) updates[f] = FieldValue.delete()
      })

      // Sync status with paymentStatus if updated
      if (
        validated.paymentStatus &&
        validated.paymentStatus !== currentData.paymentStatus
      ) {
        if (validated.paymentStatus === 'paid') {
          updates.status = 'paid'
        } else if (
          ['unpaid', 'pending', 'failed'].includes(validated.paymentStatus)
        ) {
          updates.status = 'unpaid'
        }
      }

      transaction.update(ref, updates)

      // Automatic Payment Record Creation on Status Transition
      if (
        validated.paymentStatus === 'paid' &&
        currentData.paymentStatus !== 'paid'
      ) {
        const paymentRef = db.collection(COLLECTIONS.PAYMENT).doc()
        transaction.set(paymentRef, {
          enrollmentId: id,
          studentId: currentData.studentId,
          parentId: currentData.parentId,
          student: currentData.student,
          parent: currentData.parent,
          program: currentData.program,
          amount: Number(validated.amount || currentData.amount) || 0,
          paymentMethod: (
            validated.paymentMethod ||
            currentData.paymentMethod ||
            'cash'
          ).toLowerCase(),
          transactionId: validated.transactionId || currentData.transactionId || '',
          receiptId: validated.receiptId || currentData.receiptId || '',
          paymentStatus: 'paid',
          paidAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          remark: 'Automatically created during enrollment update',
        })
      }

      // Capacity & Student Seat tracking logic
      const isSeatTakingBefore = isSeatTaking(currentData.status)
      const isSeatTakingAfter = isSeatTaking(
        updates.status || currentData.status,
      )

      const prevProgramId = currentData.programId
      const nextProgramId = validated.programId || currentData.programId

      if (prevProgramId !== nextProgramId) {
        // If it was seat-taking before, decrement old program
        if (isSeatTakingBefore) {
          transaction.update(
            db.collection(COLLECTIONS.PROGRAM).doc(prevProgramId),
            {
              totalEnrolledCount: FieldValue.increment(-1),
            },
          )
        }
        // If it is seat-taking after, increment new program
        if (isSeatTakingAfter) {
          transaction.update(
            db.collection(COLLECTIONS.PROGRAM).doc(nextProgramId),
            {
              totalEnrolledCount: FieldValue.increment(1),
            },
          )
        }
      } else if (updates.status && currentData.status !== updates.status) {
        // Normal status transitions if program did not change
        if (isSeatTakingAfter && !isSeatTakingBefore) {
          transaction.update(
            db.collection(COLLECTIONS.PROGRAM).doc(currentData.programId),
            {
              totalEnrolledCount: FieldValue.increment(1),
            },
          )
        } else if (!isSeatTakingAfter && isSeatTakingBefore) {
          transaction.update(
            db.collection(COLLECTIONS.PROGRAM).doc(currentData.programId),
            {
              totalEnrolledCount: FieldValue.increment(-1),
            },
          )
        }
      }

      return { id, ...validated }
    })

    const afterDoc = await ref.get()
    const afterData = afterDoc.data()
    const termService = require('./termService')
    const movedOffering =
      beforeData.termOfferingId !== afterData.termOfferingId ||
      beforeData.termId !== afterData.termId

    if (movedOffering && isSeatTaking(beforeData.status)) {
      await termService.syncOfferingStudent(
        beforeData.termId,
        beforeData.termOfferingId,
        { id, ...beforeData },
        'remove',
      )
    }

    if (isSeatTaking(afterData.status)) {
      await termService.syncOfferingStudent(
        afterData.termId,
        afterData.termOfferingId,
        { id, ...afterData },
        'upsert',
      )
    } else if (isSeatTaking(beforeData.status)) {
      await termService.syncOfferingStudent(
        beforeData.termId,
        beforeData.termOfferingId,
        { id, ...beforeData },
        'remove',
      )
    }

    return result
  }

  async deleteEnrollment(id) {
    const enrollmentRef = db.collection(COLLECTIONS.ENROLLMENT).doc(id)
    const enrollmentDoc = await enrollmentRef.get()
    if (!enrollmentDoc.exists) throw new Error('Enrollment not found')

    const enrollmentData = enrollmentDoc.data()
    const { status } = enrollmentData

    await db.runTransaction(async (transaction) => {
      transaction.update(enrollmentRef, {
        isDeleted: true,
        status: 'deleted',
        updatedAt: new Date().toISOString(),
      })
      if (isSeatTaking(status) && enrollmentData.programId) {
        transaction.update(
          db.collection(COLLECTIONS.PROGRAM).doc(enrollmentData.programId),
          {
            totalEnrolledCount: FieldValue.increment(-1),
          },
        )
      }
    })

    if (
      isSeatTaking(status) &&
      enrollmentData.termId &&
      enrollmentData.termOfferingId
    ) {
      await require('./termService')
        .syncOfferingStudent(
          enrollmentData.termId,
          enrollmentData.termOfferingId,
          { id, ...enrollmentData },
          'remove',
        )
        .catch((err) =>
          console.error('Failed to sync offering on delete:', err),
        )
    }

    return { message: 'Enrollment deleted successfully (Soft delete)' }
  }

  // --- Specialized Actions & Syncing ---

  async cancelEnrollment(id) {
    const enrollmentRef = db.collection(COLLECTIONS.ENROLLMENT).doc(id)
    const enrollmentDoc = await enrollmentRef.get()
    if (!enrollmentDoc.exists) throw new Error('Enrollment not found')

    const enrollmentData = enrollmentDoc.data()
    const { status } = enrollmentData

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
        transaction.update(
          db.collection(COLLECTIONS.PROGRAM).doc(enrollmentData.programId),
          {
            totalEnrolledCount: FieldValue.increment(-1),
          },
        )
      }
    })

    if (isSeatTaking(status)) {
      await require('./termService').syncOfferingStudent(
        enrollmentData.termId,
        enrollmentData.termOfferingId,
        { id, ...enrollmentData },
        'remove',
      )
    }

    return { message: 'Enrollment cancelled successfully' }
  }

  async transferEnrollment(id, transferData) {
    const ref = db.collection(COLLECTIONS.ENROLLMENT).doc(id)
    const beforeDoc = await ref.get()
    if (!beforeDoc.exists) throw new Error('Enrollment not found')
    const beforeData = beforeDoc.data()

    if (!isSeatTaking(beforeData.status)) {
      throw new Error('Only active enrollments can be transferred')
    }

    // 1. Calculate consumed sessions in the old offering
    const attendanceService = require('./attendanceService')
    const classAttendance = await attendanceService.getClassAttendance(beforeData.classId)
    let consumed = 0
    if (classAttendance) {
      Object.values(classAttendance).forEach(sessionData => {
        if (sessionData[beforeData.studentId] && ['P', 'L', 'A'].includes(sessionData[beforeData.studentId])) {
          consumed++
        }
      })
    }
    
    const remainingSessions = Math.max(0, (beforeData.enrolledSessions || 0) - consumed)

    // 2. Mark the old enrollment as transferred
    await this.updateEnrollment(id, {
      status: 'transferred',
      paymentStatus: 'transferred',
      remark: `Transferred to new class. Consumed ${consumed} sessions. ${beforeData.remark || ''}`
    })

    // 3. Create a new enrollment for the new offering
    const newEnrollmentData = {
      ...beforeData,
      termOfferingId: transferData.termOfferingId,
      classId: transferData.classId,
      termId: transferData.termId,
      branchId: transferData.branchId,
      scheduleId: transferData.scheduleId,
      enrolledSessions: remainingSessions,
      transferredSessions: (beforeData.transferredSessions || 0) + consumed,
      amount: 0, // No new charge for the transfer itself
      status: 'paid', // Keep it paid
      paymentStatus: 'paid',
      remark: `Transferred from previous class. Remaining sessions: ${remainingSessions}`,
    }
    
    // Cleanup system fields
    delete newEnrollmentData.id
    delete newEnrollmentData.createdAt
    delete newEnrollmentData.updatedAt
    
    return await this.createEnrollment(newEnrollmentData)
  }

  async getStudentEligibility(studentId, programId) {
    const existing = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where('studentId', '==', studentId)
      .where('programId', '==', programId)
      .get()

    const activeNonDeleted = existing.docs.filter((doc) => {
      const data = doc.data()
      return (
        data.isDeleted !== true &&
        !['cancelled', 'deleted'].includes(String(data.status).toLowerCase())
      )
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
    const writes = snapshot.docs.map((doc) => {
      const enrollmentData = doc.data()

      // Preserve the specific schedule assigned to this enrollment but update its snapshot if it exists in the new class data
      const currentScheduleId =
        enrollmentData.class?.schedule?.id || enrollmentData.scheduleId
      const updatedSchedule =
        (classSnapshot.schedules || []).find(
          (s) => String(s.id) === String(currentScheduleId),
        ) || enrollmentData.class?.schedule

      return {
        ref: doc.ref,
        data: {
          class: {
            ...classSnapshot,
            // Restore and update session-specific fields that get lost in the global snapshot
            schedule: updatedSchedule,
            capacity:
              updatedSchedule?.capacity ||
              enrollmentData.class?.capacity ||
              classSnapshot.capacity ||
              20,
            term: enrollmentData.class?.term,
            branch: enrollmentData.class?.branch,
          },
        },
      }
    })
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
    const { paymentMethod, bankName, amount, transactionId, receiptId, remark } =
      paymentData
    const enrollmentRef = db
      .collection(COLLECTIONS.ENROLLMENT)
      .doc(enrollmentId)

    let updatedEnrollmentData = null

    const result = await db.runTransaction(async (transaction) => {
      const enrollmentDoc = await transaction.get(enrollmentRef)
      if (!enrollmentDoc.exists) throw new Error('Enrollment not found')

      const enrollmentData = enrollmentDoc.data()
      if (
        enrollmentData.status === 'paid' &&
        paymentData.paymentStatus === 'paid'
      ) {
        throw new Error('Enrollment is already paid')
      }

      const pStatus = paymentData.paymentStatus || 'paid'
      const eStatus = pStatus === 'paid' ? 'paid' : 'unpaid'
      const now = new Date().toISOString()

      updatedEnrollmentData = {
        ...enrollmentData,
        id: enrollmentId,
        paymentStatus: pStatus.toLowerCase(),
        status: eStatus.toLowerCase(),
        updatedAt: now,
        paidAt: pStatus === 'paid' ? now : null,
      }

      // 1. Update Enrollment
      transaction.update(enrollmentRef, {
        paymentStatus: pStatus.toLowerCase(),
        status: eStatus.toLowerCase(),
        updatedAt: now,
        paidAt: pStatus === 'paid' ? now : null,
        paymentMethod:
          paymentMethod === 'cash'
            ? 'cash'
            : bankName
              ? bankName.toLowerCase()
              : 'online',
        transactionId: transactionId || '',
        receiptId: receiptId || '',
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
        bankName:
          paymentMethod === 'online'
            ? bankName
              ? bankName.toLowerCase()
              : 'online'
            : null,
        transactionId: transactionId || '',
        receiptId: receiptId || '',
        paymentStatus: pStatus.toLowerCase(),
        remark: remark || '',
        createdAt: now,
      })

      // Ensure student and parent status are set to Active upon payment processing
      if (enrollmentData.studentId) {
        transaction.update(
          db.collection(COLLECTIONS.STUDENT).doc(enrollmentData.studentId),
          { status: 'Active', updatedAt: now },
        )
      }
      if (enrollmentData.parentId) {
        transaction.update(
          db.collection(COLLECTIONS.PARENT).doc(enrollmentData.parentId),
          { status: 'Active', updatedAt: now },
        )
      }

      return {
        success: true,
        paymentId: paymentRef.id,
        enrollmentStatus: eStatus,
      }
    })

    if (updatedEnrollmentData && isSeatTaking(updatedEnrollmentData.status)) {
      const termService = require('./termService')
      await termService
        .syncOfferingStudent(
          updatedEnrollmentData.termId,
          updatedEnrollmentData.termOfferingId || updatedEnrollmentData.term?.offeringId,
          updatedEnrollmentData,
          'upsert',
        )
        .catch((err) => console.error('Failed to sync offering on payment:', err))
    }

    return result
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

  async getEnrollmentsByParent(parentId, requestingUser = null) {
    if (
      requestingUser &&
      requestingUser.role !== 'admin' &&
      requestingUser.uid !== parentId
    ) {
      throw new Error('Access Denied: You can only view your own enrollments.')
    }
    return this.getAllEnrollments({ parentId })
  }

  async getEnrollmentsByStudent(studentId, requestingUser = null) {
    const studentDoc = await db
      .collection(COLLECTIONS.STUDENT)
      .doc(studentId)
      .get()
    if (!studentDoc.exists) throw new Error('Student not found')
    const studentData = studentDoc.data()

    if (
      requestingUser &&
      requestingUser.role !== 'admin' &&
      requestingUser.uid !== studentData.parentId
    ) {
      throw new Error(
        "Access Denied: You do not have permission to view this student's enrollments.",
      )
    }
    return this.getAllEnrollments({ studentId })
  }
}

module.exports = new EnrollmentService()

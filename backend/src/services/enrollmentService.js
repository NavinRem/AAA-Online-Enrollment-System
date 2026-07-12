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

    await this.checkEnrollmentConflicts(
      studentId,
      termOfferingId,
      programId,
      offering,
      classDoc.data(),
    )

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

      // Automatic Payment Record Creation (Skip if created during class transfer without new payment)
      const isTransferEnrollment =
        newEnrollment.transferredSessions > 0 ||
        (newEnrollment.remark && String(newEnrollment.remark).startsWith('Transfer from '))
      if (newEnrollment.paymentStatus === 'paid' && !isTransferEnrollment) {
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
    let statusLower = null
    if (
      filters.status &&
      filters.status !== 'undefined' &&
      filters.status !== 'all'
    ) {
      statusLower = filters.status.toLowerCase()
      // Enhanced mapping for all valid payment statuses
      if (
        [
          'paid',
          'unpaid',
          'pending',
          'confirmed',
          'success',
        ].includes(statusLower)
      ) {
        // If it's a payment status, we can filter by paymentStatus field
        query = query.where('paymentStatus', '==', statusLower)
      } else if (['full', 'partial'].includes(statusLower)) {
        // For full or partial enrollment, filter in-memory after fetching docs
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
      .filter((e) => {
        if (e.isDeleted === true) return false

        if (statusLower) {
          if (['paid', 'unpaid', 'pending', 'confirmed', 'success'].includes(statusLower)) {
            const st = String(e.status || '').toLowerCase()
            if (['cancelled', 'canceled', 'stopped', 'deleted'].includes(st)) {
              return false
            }
          } else if (statusLower === 'full') {
            const mode = e.paymentModeType || (e.isProrated ? 'partial' : 'full')
            if (mode !== 'full') return false
          } else if (statusLower === 'partial') {
            const mode = e.paymentModeType || (e.isProrated ? 'partial' : 'full')
            if (mode !== 'partial') return false
          }
        }

        return true
      })

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
        await this.checkEnrollmentConflicts(
          currentData.studentId,
          nextOfferingId,
          validated.programId || currentData.programId,
          offering,
          null,
          id,
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

      const nextStatus = updates.status || currentData.status
      if (isSeatTaking(nextStatus) && !isSeatTaking(currentData.status)) {
        const termService = require('./termService')
        const { offering } = await termService.getOffering(
          validated.termId || currentData.termId,
          validated.termOfferingId || currentData.termOfferingId,
        )
        const scheduleCapacity =
          offering.schedule?.capacity ||
          offering.capacity ||
          currentData.class?.capacity ||
          20
        if ((offering.currentCount || 0) >= scheduleCapacity) {
          throw new Error(
            `Cannot complete payment: This class/schedule is already full (${offering.currentCount}/${scheduleCapacity}). Please change the student's schedule to another class or cancel the enrollment.`
          )
        }
      }

      transaction.update(ref, updates)

      // Automatic Payment Record Creation on Status Transition (Skip if transfer enrollment)
      const isTransferEnrollment =
        currentData.transferredSessions > 0 ||
        (currentData.remark && String(currentData.remark).startsWith('Transfer from '))
      if (
        validated.paymentStatus === 'paid' &&
        currentData.paymentStatus !== 'paid' &&
        !isTransferEnrollment
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

    if (
      !['paid', 'success', 'active', 'confirmed'].includes(
        String(beforeData.paymentStatus || beforeData.status || '').toLowerCase(),
      )
    ) {
      throw new Error('Student must complete payment before transferring to another class.')
    }

    // 1. Calculate consumed sessions in the old offering
    const attendanceService = require('./attendanceService')
    const classAttendance = await attendanceService.getClassAttendance(beforeData.classId)
    let consumed = 0
    if (classAttendance) {
      Object.values(classAttendance).forEach((sessionData) => {
        if (
          sessionData[beforeData.studentId] &&
          ['P', 'L', 'A'].includes(sessionData[beforeData.studentId])
        ) {
          consumed++
        }
      })
    }

    const remainingSessions = Math.max(0, (beforeData.enrolledSessions || 0) - consumed)

    // 2. Determine branch end dates to decide payment status
    const termService = require('./termService')

    // Fetch old term's offering to get the old branch end date
    let oldBranchEndDate
    let oldBranchName = 'previous branch'
    try {
      const { term: oldTerm, offering: oldOffering } = await termService.getOffering(
        beforeData.termId,
        beforeData.termOfferingId,
      )
      if (oldOffering?.branch?.name) {
        oldBranchName = oldOffering.branch.name
      } else if (oldOffering?.branch?.abbr) {
        oldBranchName = oldOffering.branch.abbr
      } else if (beforeData.branch?.name) {
        oldBranchName = beforeData.branch.name
      } else if (beforeData.branchName) {
        oldBranchName = beforeData.branchName
      } else if (oldOffering?.branchId || beforeData.branchId) {
        const branchService = require('./branchService')
        const bId = oldOffering?.branchId || beforeData.branchId
        const bDoc = await branchService.getBranch(bId)
        if (bDoc?.name) oldBranchName = bDoc.name
      }

      // Try branch-specific date first
      if (oldTerm.branchSettings) {
        const oldSetting = oldTerm.branchSettings.find(
          (s) => String(s.branchId) === String(oldOffering.branchId || oldOffering.branch?.id),
        )
        oldBranchEndDate = oldSetting?.endDate || oldTerm.endDate
      } else {
        oldBranchEndDate = oldTerm.endDate
      }
    } catch {
      oldBranchEndDate = beforeData.class?.term?.endDate || null
      oldBranchName = beforeData.branch?.name || beforeData.branchName || 'previous branch'
    }

    // Fetch new term's offering to get the new branch end date
    let newBranchEndDate
    let newTermStartDate
    let newTotalSessions = 0
    try {
      const { term: newTerm, offering: newOffering } = await termService.getOffering(
        transferData.termId,
        transferData.termOfferingId,
      )
      await this.checkEnrollmentConflicts(
        beforeData.studentId,
        transferData.termOfferingId,
        beforeData.programId,
        newOffering,
        null,
        id,
      )
      const targetCapacity =
        newOffering.schedule?.capacity ||
        newOffering.capacity ||
        20
      if ((newOffering.currentCount || 0) >= targetCapacity) {
        throw new Error(
          `Cannot transfer student: The destination class/schedule is already full (${newOffering.currentCount}/${targetCapacity}).`
        )
      }
      if (newTerm.branchSettings) {
        const newSetting = newTerm.branchSettings.find(
          (s) => String(s.branchId) === String(newOffering.branchId || newOffering.branch?.id),
        )
        newBranchEndDate = newSetting?.endDate || newTerm.endDate
        newTermStartDate = newSetting?.startDate || newTerm.startDate
      } else {
        newBranchEndDate = newTerm.endDate
        newTermStartDate = newTerm.startDate
      }
      newTotalSessions = newTerm.totalSessions || 0
    } catch {
      newBranchEndDate = null
      newTermStartDate = null
    }

    // 3. Determine payment status and sessions owed in new branch
    let newBranchPassed = 0
    if (newTermStartDate && newTotalSessions > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const nStart = new Date(newTermStartDate)
      nStart.setHours(0, 0, 0, 0)
      const nEnd = newBranchEndDate ? new Date(newBranchEndDate) : null
      if (nEnd) nEnd.setHours(23, 59, 59, 999)

      if (today < nStart) {
        newBranchPassed = 0
      } else if (nEnd && today > nEnd) {
        newBranchPassed = newTotalSessions
      } else {
        const daysElapsedNew = Math.floor((today - nStart) / (24 * 60 * 60 * 1000))
        newBranchPassed = Math.min(newTotalSessions, Math.max(0, Math.floor(daysElapsedNew / 7) + 1))
      }
    }
    const newBranchRemainingSessions = Math.max(0, newTotalSessions - newBranchPassed)
    const extraSessionsToPay = Math.max(0, newBranchRemainingSessions - remainingSessions)

    const sameFinalDate = extraSessionsToPay === 0 && (
      oldBranchEndDate &&
      newBranchEndDate &&
      new Date(oldBranchEndDate).toDateString() === new Date(newBranchEndDate).toDateString()
    )

    let newStatus
    let newPaymentStatus
    let newEnrolledSessions

    if (extraSessionsToPay === 0) {
      newStatus = 'paid'
      newPaymentStatus = 'paid'
      newEnrolledSessions = remainingSessions
    } else {
      newStatus = 'unpaid'
      newPaymentStatus = 'unpaid'
      newEnrolledSessions = Math.max(remainingSessions, newBranchRemainingSessions)
    }

    const transferRemark = extraSessionsToPay > 0
      ? `Transfer from "${oldBranchName}", with ${remainingSessions} remaining paid session(s). Note: ${extraSessionsToPay} extra session(s) require payment in new branch (alert needed at least 1 week before paid sessions expire).`
      : `Transfer from "${oldBranchName}", with ${remainingSessions} remaining paid session(s).`

    // 4. Move attendance data to new class
    try {
      const oldAttendanceSnap = await db
        .collectionGroup('attendance')
        .where('classId', '==', beforeData.classId)
        .get()

      const batch = db.batch()
      let opsCount = 0

      oldAttendanceSnap.forEach((doc) => {
        const data = doc.data()
        if (
          String(data.studentId) === String(beforeData.studentId) ||
          doc.id.endsWith(`_${beforeData.studentId}`)
        ) {
          const newDocId = `${data.sessionId}_${beforeData.studentId}`
          const newRef = db
            .collection(COLLECTIONS.TERM)
            .doc(transferData.termId)
            .collection(COLLECTIONS.CLASS)
            .doc(transferData.classId)
            .collection(COLLECTIONS.SCHEDULE)
            .doc(transferData.scheduleId)
            .collection('attendance')
            .doc(newDocId)

          batch.set(
            newRef,
            {
              ...data,
              classId: transferData.classId,
              termId: transferData.termId,
              scheduleId: transferData.scheduleId,
              updatedAt: new Date().toISOString(),
            },
            { merge: true },
          )

          batch.delete(doc.ref)
          opsCount++
        }
      })

      if (opsCount > 0) {
        await batch.commit()
      }
    } catch (attErr) {
      console.error('Failed to move attendance data during transfer:', attErr)
    }

    // 5. Mark the old enrollment as transferred
    await this.updateEnrollment(id, {
      status: 'transferred',
      paymentStatus: 'transferred',
      remark: `Transferred to new class. Consumed ${consumed} sessions. ${beforeData.remark || ''}`,
    })

    // 6. Create the new enrollment
    // Build only from allowed validator fields — do NOT spread beforeData which
    // contains Firestore snapshot objects (student, parent, class, term, etc.)
    const newEnrollmentData = {
      parentId: beforeData.parentId,
      studentId: beforeData.studentId,
      programId: beforeData.programId,
      classId: transferData.classId,
      termId: transferData.termId,
      termOfferingId: transferData.termOfferingId,
      branchId: transferData.branchId || beforeData.branchId || '',
      scheduleId: transferData.scheduleId || beforeData.scheduleId || '',
      enrollAt: new Date().toISOString(),
      enrollmentType: beforeData.enrollmentType || '',
      status: newStatus,
      paymentStatus: newPaymentStatus,
      paymentMethod: transferData.paymentMethod || beforeData.paymentMethod || 'cash',
      bankName: transferData.bankName || beforeData.bankName || null,
      isProrated: !!beforeData.isProrated,
      isSponsorship: !!beforeData.isSponsorship,
      sponsorName: beforeData.sponsorName || '',
      isCustomPrice: !!beforeData.isCustomPrice,
      discountType: beforeData.discountType || 'dollar',
      customPrice: parseFloat(beforeData.customPrice || 0),
      discountAmount: parseFloat(beforeData.discountAmount || 0),
      enrolledSessions: newEnrolledSessions,
      transferredSessions: (beforeData.transferredSessions || 0) + consumed,
      amount:
        transferData.amount !== undefined
          ? Number(transferData.amount)
          : Number(beforeData.amount || 0),
      remark: transferRemark,
      receiptId: sameFinalDate ? (transferData.receiptId || beforeData.receiptId || '') : '',
      transactionId: sameFinalDate ? (transferData.transactionId || beforeData.transactionId || '') : '',
      hasPassedExam: !!beforeData.hasPassedExam,
      hasReceivedCertificate: !!beforeData.hasReceivedCertificate,
      hasReceivedReportCard: !!beforeData.hasReceivedReportCard,
    }

    const result = await this.createEnrollment(newEnrollmentData)
    return {
      ...result,
      transferSummary: {
        consumed,
        remainingSessions,
        sameFinalDate: !!sameFinalDate,
        newStatus,
        newPaymentStatus,
        newEnrolledSessions,
        oldBranchEndDate,
        newBranchEndDate,
      },
    }
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

      const pStatus =
        paymentData.paymentStatus && paymentData.paymentStatus !== 'unpaid'
          ? paymentData.paymentStatus
          : 'paid'
      const eStatus = ['paid', 'success', 'confirmed', 'active', 'partial'].includes(
        String(pStatus).toLowerCase(),
      )
        ? 'paid'
        : 'unpaid'
      const now = new Date().toISOString()

      if (!isSeatTaking(enrollmentData.status) && isSeatTaking(eStatus)) {
        const termService = require('./termService')
        const { offering } = await termService.getOffering(
          enrollmentData.termId,
          enrollmentData.termOfferingId,
        )
        const scheduleCapacity =
          offering.schedule?.capacity ||
          offering.capacity ||
          enrollmentData.class?.capacity ||
          20
        if ((offering.currentCount || 0) >= scheduleCapacity) {
          throw new Error(
            `Cannot complete payment: This class/schedule is already full (${offering.currentCount}/${scheduleCapacity}). Please change the student's schedule to another class or cancel the enrollment.`
          )
        }
      }

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

  async checkEnrollmentConflicts(
    studentId,
    termOfferingId,
    programId,
    offering,
    classData,
    excludeEnrollmentId = null,
  ) {
    const existingSnap = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where('studentId', '==', studentId)
      .get()

    const activeNonDeleted = existingSnap.docs.filter((doc) => {
      const data = doc.data()
      if (
        excludeEnrollmentId &&
        (String(doc.id) === String(excludeEnrollmentId) ||
          String(data.id) === String(excludeEnrollmentId) ||
          String(data.enrollmentId) === String(excludeEnrollmentId))
      )
        return false
      const statusLower = String(data.status || '').toLowerCase().trim()
      const activeStatuses = [
        'paid',
        'unpaid',
        'active',
        'confirmed',
        'success',
        'pending',
        'partial',
      ]
      return data.isDeleted !== true && activeStatuses.includes(statusLower)
    })

    if (
      activeNonDeleted.some(
        (doc) => String(doc.data().termOfferingId) === String(termOfferingId),
      )
    ) {
      throw new Error('Student already enrolled for this term offering')
    }

    if (
      activeNonDeleted.some(
        (doc) => String(doc.data().programId) === String(programId),
      )
    ) {
      throw new Error('Student is already enrolled in this program')
    }

    const newBranchIds = new Set(
      [
        offering?.branchId,
        offering?.branch?.id,
        offering?.branch?.abbr,
        classData?.branchId,
        classData?.branch?.id,
        classData?.branch?.abbr,
      ]
        .filter(Boolean)
        .map((val) => String(val).toLowerCase().trim()),
    )

    const newDay =
      offering?.schedule?.day ||
      offering?.scheduleDay ||
      classData?.schedule?.day ||
      classData?.scheduleDay
    const newTime =
      offering?.schedule?.time ||
      offering?.schedule?.startTime ||
      offering?.scheduleTime ||
      classData?.schedule?.time ||
      classData?.schedule?.startTime ||
      classData?.scheduleTime
    const newDayStr = String(newDay || '').toLowerCase().trim()
    const newTimeStr = String(newTime || '').toLowerCase().trim()

    for (const doc of activeNonDeleted) {
      const e = doc.data()
      const existingBranchIds = new Set(
        [
          e.branchId,
          e.branch?.id,
          e.class?.branch?.id,
          e.class?.branchId,
          e.branchAbbr,
          e.branch?.abbr,
          e.class?.branch?.abbr,
        ]
          .filter(Boolean)
          .map((val) => String(val).toLowerCase().trim()),
      )

      const hasBranchInfo = newBranchIds.size > 0 && existingBranchIds.size > 0
      const isSameBranch =
        !hasBranchInfo ||
        [...newBranchIds].some((id) => existingBranchIds.has(id))

      if (!isSameBranch) {
        throw new Error(
          'Branch Conflict: A student cannot enroll in programs across different branches. Ensure that all programs are studied in the same branch.',
        )
      }

      let existingDay =
        e.class?.schedule?.day || e.schedule?.day || e.scheduleDay || e.day
      let existingTime =
        e.class?.schedule?.time ||
        e.class?.schedule?.startTime ||
        e.schedule?.time ||
        e.scheduleTime ||
        e.time
      if (!existingDay || !existingTime) {
        if (e.classSchedule) {
          existingDay = e.classSchedule.split(' ')[0]
          existingTime = e.classSchedule.split(' ')[1]?.replace(/[()]/g, '')
        }
      }

      const existingDayStr = String(existingDay || '').toLowerCase().trim()
      const existingTimeStr = String(existingTime || '').toLowerCase().trim()

      if (newDayStr && newTimeStr && existingDayStr && existingTimeStr) {
        if (newDayStr === existingDayStr && newTimeStr === existingTimeStr) {
          throw new Error(
            `Schedule Conflict: Student is already enrolled in another program on this exact schedule (${newDay} ${newTime}).`,
          )
        }
      }
    }
  }
}

module.exports = new EnrollmentService()

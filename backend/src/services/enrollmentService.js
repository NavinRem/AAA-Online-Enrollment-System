const { db, COLLECTIONS } = require('../config/database')
const authService = require('./authService')
const profileHelper = require('../utils/profileHelper')
const branchService = require('./branchService')
const {
  validateEnrollment,
  validateUpdateEnrollment,
} = require('../validators/enrollmentValidator')

class EnrollmentService {
  async createEnrollment(enrollmentData) {
    const validatedData = validateEnrollment(enrollmentData)
    const { parentId, studentId, programId, classId } = validatedData

    let enrollmentId
    await db.runTransaction(async (transaction) => {
      const classRef = db.collection(COLLECTIONS.CLASS).doc(classId)
      const studentRef = db.collection(COLLECTIONS.STUDENT).doc(studentId)
      const programRef = db.collection(COLLECTIONS.PROGRAM).doc(programId)
      const parentRef = db.collection(COLLECTIONS.USER).doc(parentId)

      const existingEnrollmentQuery = db
        .collection(COLLECTIONS.ENROLLMENT)
        .where('studentId', '==', studentId)
        .where('classId', '==', classId)
        .where('parentId', '==', parentId)

      const [
        classDoc,
        studentDoc,
        programDoc,
        parentDoc,
        existingEnrollmentSnapshot,
      ] = await Promise.all([
        transaction.get(classRef),
        transaction.get(studentRef),
        transaction.get(programRef),
        transaction.get(parentRef),
        transaction.get(existingEnrollmentQuery),
      ])

      if (!classDoc.exists) throw new Error('Class instance not found')
      if (!studentDoc.exists) throw new Error('Student not found')
      if (!programDoc.exists) throw new Error('Program model not found')
      if (!parentDoc.exists) throw new Error('Parent not found')

      if (parentDoc.data().status !== 'active') {
        throw new Error('Parent is not active, unable to make enrollment')
      }

      if (!existingEnrollmentSnapshot.empty) {
        const activeEnrollment = existingEnrollmentSnapshot.docs.find((doc) => {
          const status = doc.data().status.toLowerCase()
          return status !== 'cancelled' && status !== 'canceled'
        })

        if (activeEnrollment) {
          throw new Error('Student already enrolled for this class instance')
        }
      }

      const classData = classDoc.data()
      const studentData = studentDoc.data()
      const programData = programDoc.data()
      const parentData = parentDoc.data()

      if (classData.enrolledCount >= classData.maxCapacity) {
        throw new Error('Class is at full capacity')
      }

      const enrollmentRef = db.collection(COLLECTIONS.ENROLLMENT).doc()
      enrollmentId = enrollmentRef.id

      const data = {
        ...validatedData,
        parent: profileHelper.getUserSnapshot(parentId, parentData),
        student: profileHelper.getStudentSnapshot(studentId, studentData),
        class: profileHelper.getClassSnapshot(classId, {
          ...classData,
          enrolledCount: (classData.enrolledCount || 0) + 1,
        }),

        enrollAt: new Date().toISOString(),
        totalSessions: programData.totalSessions || 0,
        remainingSessions: programData.totalSessions || 0,
        passedSessions: 0,
        branchId: classData.branchId,
      }

      transaction.set(enrollmentRef, data)
      await this._updateClassStudentCount(transaction, classId, 1, classDoc)
    })

    if (enrollmentId) {
      const enrollmentDoc = await db
        .collection(COLLECTIONS.ENROLLMENT)
        .doc(enrollmentId)
        .get()
      const bId = enrollmentDoc.data()?.branchId
      if (bId) await branchService.calculateAndSyncStats(bId)
    }

    return { id: enrollmentId, message: 'Enrollment created successfully' }
  }

  async getAllEnrollments() {
    const [snapshot, programsSnap, classesSnap] = await Promise.all([
      db.collection(COLLECTIONS.ENROLLMENT).get(),
      db.collection(COLLECTIONS.PROGRAM).get(),
      db.collection(COLLECTIONS.CLASS).get(),
    ])

    const programsMap = {}
    programsSnap.forEach((doc) => (programsMap[doc.id] = doc.data()))

    const classesMap = {}
    classesSnap.forEach((doc) => {
      const c = doc.data()
      const scheduleString = (c.schedules || [])
        .map((s) => `${s.day}: ${s.timeslot}`)
        .join(', ')
      classesMap[doc.id] = { ...c, scheduleString }
    })

    return snapshot.docs.map((doc) => {
      const data = doc.data()
      const programData = programsMap[data.programId]
      const classInstance = classesMap[data.classId]

      return {
        id: doc.id,
        ...data,
        displayStatus: this._getDisplayStatus(data.status, data.paymentStatus),
        classSchedule: classInstance?.scheduleString,
        totalSessions:
          data.totalSessions ||
          classInstance?.totalSessions ||
          programData?.totalSessions,
        amount: data.amount || programData?.basePrice,
      }
    })
  }

  async getEnrollment(id) {
    const doc = await this._getDocOrThrow(
      db.collection(COLLECTIONS.ENROLLMENT).doc(id),
      'Enrollment',
    )

    const data = doc.data()

    const [programDoc, classDoc] = await Promise.all([
      data.programId
        ? db.collection(COLLECTIONS.PROGRAM).doc(data.programId).get()
        : Promise.resolve({ exists: false }),
      data.classId
        ? db.collection(COLLECTIONS.CLASS).doc(data.classId).get()
        : Promise.resolve({ exists: false }),
    ])

    const programData = programDoc.exists ? programDoc.data() : null
    const classData = classDoc.exists ? classDoc.data() : null

    let resolvedTeachers = []
    if (programData?.teachers && programData.teachers.length > 0) {
      resolvedTeachers = await Promise.all(
        programData.teachers.map(async (t) => {
          const tId = t.id || t
          if (!tId) return null
          return await authService.getUser(tId)
        }),
      )
    }

    let classSchedule = data.classSchedule
    if (classData && classData.schedules) {
      classSchedule = classData.schedules
        .map((s) => `${s.day}: ${s.timeslot}`)
        .join(', ')
    }

    return {
      id: doc.id,
      ...data,
      displayStatus: this._getDisplayStatus(data.status, data.paymentStatus),
      classSchedule,
      program: programData
        ? { id: data.programId, ...programData, teachers: resolvedTeachers }
        : null,
      class: classData
        ? {
            id: data.classId,
            ...classData,
            scheduleString: classSchedule,
          }
        : null,
      totalSessions:
        data.totalSessions ||
        data.remainingSessions ||
        programData?.totalSessions ||
        0,
      amount: data.amount || programData?.basePrice || 0,
    }
  }

  async cancelEnrollment(enrollmentId) {
    const enrollmentRef = db
      .collection(COLLECTIONS.ENROLLMENT)
      .doc(enrollmentId)
    const doc = await this._getDocOrThrow(enrollmentRef, 'Enrollment')

    const data = doc.data()
    if (data.status === 'cancelled') throw new Error('Already cancelled')

    await db.runTransaction(async (transaction) => {
      transaction.update(enrollmentRef, {
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
      })

      await this._updateClassStudentCount(transaction, data.classId, -1)
    })

    return { message: 'Enrollment cancelled successfully' }
  }

  async updateEnrollment(enrollmentId, updateData) {
    const validatedUpdate = validateUpdateEnrollment(updateData)
    const enrollmentRef = db
      .collection(COLLECTIONS.ENROLLMENT)
      .doc(enrollmentId)

    await db.runTransaction(async (transaction) => {
      const doc = await this._getDocOrThrow(
        enrollmentRef,
        'Enrollment',
        transaction,
      )

      const oldData = doc.data()
      const oldClassId = oldData.classId
      const newClassId = validatedUpdate.classId || oldClassId

      const oldStatus = (oldData.status || '').toLowerCase()
      const newStatus = (validatedUpdate.status || oldStatus).toLowerCase()

      const wasActive = !['cancelled', 'canceled'].includes(oldStatus)
      const isActive = !['cancelled', 'canceled'].includes(newStatus)

      if (oldClassId !== newClassId) {
        if (wasActive)
          await this._updateClassStudentCount(transaction, oldClassId, -1)
        if (isActive)
          await this._updateClassStudentCount(transaction, newClassId, 1)
      } else if (wasActive !== isActive) {
        await this._updateClassStudentCount(
          transaction,
          oldClassId,
          isActive ? 1 : -1,
        )
      }

      transaction.update(enrollmentRef, validatedUpdate)
    })

    return { id: enrollmentId, ...validatedUpdate }
  }

  async deleteEnrollment(enrollmentId) {
    const enrollmentRef = db
      .collection(COLLECTIONS.ENROLLMENT)
      .doc(enrollmentId)
    const doc = await this._getDocOrThrow(enrollmentRef, 'Enrollment')

    const data = doc.data()

    if (data.status !== 'cancelled' && data.status !== 'canceled') {
      await db.runTransaction(async (transaction) => {
        await this._updateClassStudentCount(transaction, data.classId, -1)
        transaction.delete(enrollmentRef)
      })
    } else {
      await enrollmentRef.delete()
    }

    return { message: 'Enrollment deleted permanently' }
  }

  _getDisplayStatus(status, paymentStatus) {
    const sStatus = (status || '').toLowerCase()
    const pStatus = (paymentStatus || '').toLowerCase()

    if (sStatus === 'cancelled' || sStatus === 'canceled') return 'Canceled'
    if (pStatus === 'paid') return 'Paid'
    if (sStatus === 'pending') return 'Pending'
    return 'Unpaid'
  }

  async _getDocOrThrow(ref, label, transaction = null) {
    const doc = transaction ? await transaction.get(ref) : await ref.get()
    if (!doc.exists) throw new Error(`${label} not found`)
    return doc
  }

  async _updateClassStudentCount(
    transaction,
    classId,
    increment,
    classDoc = null,
  ) {
    if (!classId) return
    const doc =
      classDoc ||
      (await transaction.get(db.collection(COLLECTIONS.CLASS).doc(classId)))
    if (doc.exists) {
      const currentCount = doc.data().enrolledCount || 0
      const newCount = Math.max(0, currentCount + increment)
      transaction.update(doc.ref, {
        enrolledCount: newCount,
        updatedAt: new Date().toISOString(),
      })
    }
  }

  /**
   * Sync all enrollments when a class snapshot changes
   */
  async syncEnrollmentsWithClass(classId, classSnapshot) {
    const snapshot = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where('classId', '==', classId)
      .get()

    if (snapshot.empty) return

    const batch = db.batch()
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        class: classSnapshot,
        updatedAt: new Date().toISOString(),
      })
    })
    await batch.commit()
    console.log(`🔄 Synced Class snapshot to ${snapshot.size} Enrollments`)
  }
}

module.exports = new EnrollmentService()

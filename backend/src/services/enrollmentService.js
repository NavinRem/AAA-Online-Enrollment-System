const { db, COLLECTIONS } = require('../config/database')
const profileHelper = require('../utils/profileHelper')
const branchService = require('./branchService')
const {
  validateEnrollment,
  validateUpdateEnrollment,
} = require('../validators/enrollmentValidator')

class EnrollmentService {
  async checkEligibility(studentId, programId) {
    const studentDoc = await db
      .collection(COLLECTIONS.STUDENT)
      .doc(studentId)
      .get()
    const programDoc = await db
      .collection(COLLECTIONS.PROGRAM)
      .doc(programId)
      .get()

    if (!studentDoc.exists) throw new Error('Student not found')
    if (!programDoc.exists) throw new Error('Program not found')

    const student = studentDoc.data()
    const program = programDoc.data()

    if (program.minAge && student.age < program.minAge) {
      return {
        isEligible: false,
        reason: `Student is too young (min age: ${program.minAge})`,
      }
    }
    if (program.maxAge && student.age > program.maxAge) {
      return {
        isEligible: false,
        reason: `Student is too old (max age: ${program.maxAge})`,
      }
    }

    const snapshot = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where('studentId', '==', studentId)
      .where('programId', '==', programId)
      .get()

    const activeEnrollment = snapshot.docs.find((doc) => {
      const s = (doc.data().status || '').toLowerCase()
      return s !== 'cancelled'
    })

    if (activeEnrollment) {
      return {
        isEligible: false,
        reason: 'Student is already actively enrolled in this program',
      }
    }

    return { isEligible: true, reason: null }
  }

  async createEnrollment(enrollmentData) {
    const validatedData = validateEnrollment(enrollmentData)
    const { parentId, studentId, programId, classId } = validatedData

    const eligibility = await this.checkEligibility(studentId, programId)
    if (!eligibility.isEligible) throw new Error(eligibility.reason)

    let enrollmentId
    await db.runTransaction(async (transaction) => {
      const parentRef = db.collection(COLLECTIONS.PARENT).doc(parentId)
      const studentRef = db.collection(COLLECTIONS.STUDENT).doc(studentId)
      const programRef = db.collection(COLLECTIONS.PROGRAM).doc(programId)
      const classRef = db.collection(COLLECTIONS.CLASS).doc(classId)

      const [parentDoc, studentDoc, programDoc, classDoc] = await Promise.all([
        transaction.get(parentRef),
        transaction.get(studentRef),
        transaction.get(programRef),
        transaction.get(classRef),
      ])

      if (!parentDoc.exists) throw new Error('Parent not found')
      if (!studentDoc.exists) throw new Error('Student not found')
      if (!programDoc.exists) throw new Error('Program not found')
      if (!classDoc.exists) throw new Error('Class not found')

      const classData = classDoc.data()
      if (classData.enrolledCount >= classData.maxCapacity) {
        throw new Error('Class is at full capacity')
      }

      const enrollmentRef = db.collection(COLLECTIONS.ENROLLMENT).doc()
      enrollmentId = enrollmentRef.id

      const data = {
        ...validatedData,
        parent: profileHelper.getParentSnapshot(parentId, parentDoc.data()),
        student: profileHelper.getStudentSnapshot(studentId, studentDoc.data()),
        program: profileHelper.getProgramSnapshot(programId, programDoc.data()),
        class: profileHelper.getClassSnapshot(classId, {
          ...classData,
          enrolledCount: (classData.enrolledCount || 0) + 1,
        }),
        branchId: classData.branchId,
      }

      transaction.set(enrollmentRef, data)

      transaction.update(classRef, {
        enrolledCount: (classData.enrolledCount || 0) + 1,
        updatedAt: new Date().toISOString(),
      })
    })

    const snap = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .doc(enrollmentId)
      .get()
    const bId = snap.data()?.branchId
    if (bId) branchService.calculateAndSyncStats(bId).catch(console.error)

    return { id: enrollmentId, message: 'Enrollment created successfully' }
  }

  async getAllEnrollments(filters = {}) {
    let query = db.collection(COLLECTIONS.ENROLLMENT)

    if (filters.parentId)
      query = query.where('parentId', '==', filters.parentId)
    if (filters.studentId)
      query = query.where('studentId', '==', filters.studentId)
    if (filters.programId)
      query = query.where('programId', '==', filters.programId)
    if (filters.classId) query = query.where('classId', '==', filters.classId)
    if (filters.branchId)
      query = query.where('branchId', '==', filters.branchId)
    if (filters.status) query = query.where('status', '==', filters.status)
    if (filters.paymentStatus)
      query = query.where('paymentStatus', '==', filters.paymentStatus)

    const snapshot = await query.get()
    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        displayStatus: this.getDisplayStatus(data.status, data.paymentStatus),
      }
    })
  }

  async getEnrollment(id) {
    if (!id) throw new Error('Enrollment ID is required')
    const doc = await db.collection(COLLECTIONS.ENROLLMENT).doc(id).get()
    if (!doc.exists) throw new Error('Enrollment not found')

    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      displayStatus: this.getDisplayStatus(data.status, data.paymentStatus),
    }
  }

  async updateEnrollment(id, updateData) {
    if (!id) throw new Error('Enrollment ID is required')
    const validatedUpdate = validateUpdateEnrollment(updateData)
    const enrollmentRef = db.collection(COLLECTIONS.ENROLLMENT).doc(id)

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(enrollmentRef)
      if (!doc.exists) throw new Error('Enrollment not found')

      const oldData = doc.data()
      const oldClassId = oldData.classId
      const newClassId = validatedUpdate.classId || oldClassId

      const oldStatus = (oldData.status || '').toLowerCase()
      const newStatus = (validatedUpdate.status || oldStatus).toLowerCase()

      const wasActive = oldStatus !== 'cancelled'
      const isActive = newStatus !== 'cancelled'

      if (oldClassId !== newClassId) {
        if (wasActive) await this.updateClassCount(transaction, oldClassId, -1)
        if (isActive) await this.updateClassCount(transaction, newClassId, 1)
      } else if (wasActive !== isActive) {
        await this.updateClassCount(transaction, oldClassId, isActive ? 1 : -1)
      }

      if (
        validatedUpdate.parentId &&
        validatedUpdate.parentId !== oldData.parentId
      ) {
        const pDoc = await transaction.get(
          db.collection(COLLECTIONS.PARENT).doc(validatedUpdate.parentId),
        )
        if (pDoc.exists)
          validatedUpdate.parent = profileHelper.getParentSnapshot(
            pDoc.id,
            pDoc.data(),
          )
      }
      if (
        validatedUpdate.studentId &&
        validatedUpdate.studentId !== oldData.studentId
      ) {
        const sDoc = await transaction.get(
          db.collection(COLLECTIONS.STUDENT).doc(validatedUpdate.studentId),
        )
        if (sDoc.exists)
          validatedUpdate.student = profileHelper.getStudentSnapshot(
            sDoc.id,
            sDoc.data(),
          )
      }
      if (
        validatedUpdate.programId &&
        validatedUpdate.programId !== oldData.programId
      ) {
        const pDoc = await transaction.get(
          db.collection(COLLECTIONS.PROGRAM).doc(validatedUpdate.programId),
        )
        if (pDoc.exists)
          validatedUpdate.program = profileHelper.getProgramSnapshot(
            pDoc.id,
            pDoc.data(),
          )
      }
      if (
        validatedUpdate.classId &&
        validatedUpdate.classId !== oldData.classId
      ) {
        const cDoc = await transaction.get(
          db.collection(COLLECTIONS.CLASS).doc(validatedUpdate.classId),
        )
        if (cDoc.exists)
          validatedUpdate.class = profileHelper.getClassSnapshot(
            cDoc.id,
            cDoc.data(),
          )
      }

      transaction.update(enrollmentRef, validatedUpdate)
    })

    return { id, ...validatedUpdate }
  }

  async deleteEnrollment(id) {
    if (!id) throw new Error('Enrollment ID is required')
    const enrollmentRef = db.collection(COLLECTIONS.ENROLLMENT).doc(id)

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(enrollmentRef)
      if (!doc.exists) throw new Error('Enrollment not found')

      const data = doc.data()
      const status = (data.status || '').toLowerCase()
      const isActive = status !== 'cancelled'

      if (isActive && data.classId) {
        await this.updateClassCount(transaction, data.classId, -1)
      }

      transaction.delete(enrollmentRef)
    })

    return { message: 'Enrollment deleted permanently' }
  }

  async cancelEnrollment(id) {
    if (!id) throw new Error('Enrollment ID is required')
    return await this.updateEnrollment(id, { status: 'cancelled' })
  }

  async getStudentEligibility(studentId, programId) {
    return await this.checkEligibility(studentId, programId)
  }

  async updateClassCount(transaction, classId, increment) {
    const ref = db.collection(COLLECTIONS.CLASS).doc(classId)
    const doc = await transaction.get(ref)
    if (doc.exists) {
      const current = doc.data().enrolledCount || 0
      transaction.update(ref, {
        enrolledCount: Math.max(0, current + increment),
        updatedAt: new Date().toISOString(),
      })
    }
  }

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
  }

  getDisplayStatus(status, paymentStatus) {
    const s = (status || '').toLowerCase()
    const p = (paymentStatus || '').toLowerCase()
    if (s === 'cancelled') return 'Cancelled'
    if (p === 'paid') return 'Paid'
    if (s === 'pending') return 'Pending'
    return 'Unpaid'
  }
}

module.exports = new EnrollmentService()

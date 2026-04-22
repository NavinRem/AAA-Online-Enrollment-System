const { db, COLLECTIONS } = require('../config/database')
const profileHelper = require('../utils/profileHelper')

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
    if (classData.currentCount >= classData.capacity) {
      throw new Error('Class is full')
    }

    const existingEnrollment = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where('studentId', '==', studentId)
      .where('classId', '==', classId)
      .where('status', '==', 'active')
      .get()

    if (!existingEnrollment.empty) {
      throw new Error('Student already enrolled for this class')
    }

    const studentSnapshot = profileHelper.getStudentSnapshot(studentId, studentDoc.data())
    const programSnapshot = profileHelper.getProgramSnapshot(programId, programDoc.data())
    const classSnapshot = profileHelper.getClassSnapshot(classId, classData)

    const enrollmentId = db.collection(COLLECTIONS.ENROLLMENT).doc().id
    const newEnrollment = {
      studentId,
      programId,
      classId,
      parentId: studentDoc.data().parentId,
      student: studentSnapshot,
      program: programSnapshot,
      class: classSnapshot,
      status: 'active',
      enrollmentDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }

    await db.runTransaction(async (transaction) => {
      transaction.set(db.collection(COLLECTIONS.ENROLLMENT).doc(enrollmentId), newEnrollment)
      transaction.update(db.collection(COLLECTIONS.CLASS).doc(classId), {
        currentCount: (classData.currentCount || 0) + 1,
      })
    })

    return { id: enrollmentId, ...newEnrollment }
  }

  async getAllEnrollments(filters = {}) {
    let query = db.collection(COLLECTIONS.ENROLLMENT)
    if (filters.studentId) query = query.where('studentId', '==', filters.studentId)
    if (filters.classId) query = query.where('classId', '==', filters.classId)
    if (filters.status) query = query.where('status', '==', filters.status)

    const snapshot = await query.get()
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  }

  async getEnrollment(id) {
    const doc = await db.collection(COLLECTIONS.ENROLLMENT).doc(id).get()
    if (!doc.exists) throw new Error('Enrollment not found')
    return { id: doc.id, ...doc.data() }
  }

  async updateEnrollment(id, updateData) {
    const ref = db.collection(COLLECTIONS.ENROLLMENT).doc(id)
    const doc = await ref.get()
    if (!doc.exists) throw new Error('Enrollment not found')

    await ref.update(updateData)
    return { id, ...updateData }
  }

  async deleteEnrollment(id) {
    const enrollmentRef = db.collection(COLLECTIONS.ENROLLMENT).doc(id)
    const enrollmentDoc = await enrollmentRef.get()
    if (!enrollmentDoc.exists) throw new Error('Enrollment not found')

    const { classId, status } = enrollmentDoc.data()

    await db.runTransaction(async (transaction) => {
      transaction.delete(enrollmentRef)
      if (status === 'active') {
        const classRef = db.collection(COLLECTIONS.CLASS).doc(classId)
        const classDoc = await transaction.get(classRef)
        if (classDoc.exists) {
          const currentCount = classDoc.data().currentCount || 0
          transaction.update(classRef, { currentCount: Math.max(0, currentCount - 1) })
        }
      }
    })

    return { message: 'Enrollment deleted successfully' }
  }

  // --- Specialized Actions & Syncing ---

  async cancelEnrollment(id) {
    const enrollmentRef = db.collection(COLLECTIONS.ENROLLMENT).doc(id)
    const enrollmentDoc = await enrollmentRef.get()
    if (!enrollmentDoc.exists) throw new Error('Enrollment not found')

    const { classId, status } = enrollmentDoc.data()
    if (status !== 'active') throw new Error('Only active enrollments can be cancelled')

    await db.runTransaction(async (transaction) => {
      transaction.update(enrollmentRef, { status: 'cancelled', cancelledAt: new Date().toISOString() })
      const classRef = db.collection(COLLECTIONS.CLASS).doc(classId)
      const classDoc = await transaction.get(classRef)
      if (classDoc.exists) {
        const currentCount = classDoc.data().currentCount || 0
        transaction.update(classRef, { currentCount: Math.max(0, currentCount - 1) })
      }
    })

    return { message: 'Enrollment cancelled successfully' }
  }

  async getStudentEligibility(studentId, programId) {
    const existing = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where('studentId', '==', studentId)
      .where('programId', '==', programId)
      .where('status', '==', 'active')
      .get()

    return { isEligible: existing.empty, reason: existing.empty ? null : 'Already enrolled in this program' }
  }

  async syncEnrollmentsWithClass(classId, classSnapshot) {
    const snapshot = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where('classId', '==', classId)
      .get()

    if (snapshot.empty) return

    const batch = db.batch()
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { class: classSnapshot })
    })
    await batch.commit()
  }

  async syncEnrollmentsWithProgram(programId, programSnapshot) {
    const snapshot = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where('programId', '==', programId)
      .get()

    if (snapshot.empty) return

    const batch = db.batch()
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { program: programSnapshot })
    })
    await batch.commit()
  }
}

module.exports = new EnrollmentService()

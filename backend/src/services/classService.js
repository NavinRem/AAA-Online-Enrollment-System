const { db, COLLECTIONS } = require('../config/database')
const profileHelper = require('../utils/profileHelper')
const {
  validateClass,
  validateUpdateClass,
} = require('../validators/classValidator')

class ClassService {
  async createClass(classData) {
    const validated = validateClass(classData)

    const [programDoc, teacherDoc, branchDoc, termDoc, levelDoc] = await Promise.all([
      db.collection(COLLECTIONS.PROGRAM).doc(validated.programId).get(),
      db.collection(COLLECTIONS.TEACHER).doc(validated.teacherId).get(),
      db.collection(COLLECTIONS.BRANCH).doc(validated.branchId).get(),
      db.collection(COLLECTIONS.TERM).doc(validated.termId).get(),
      db.collection(COLLECTIONS.LEVEL).doc(validated.levelId).get(),
    ])

    if (!programDoc.exists) throw new Error('Program not found')
    if (!teacherDoc.exists) throw new Error('Teacher not found')
    if (!branchDoc.exists) throw new Error('Branch not found')
    if (!termDoc.exists) throw new Error('Term not found')
    if (!levelDoc.exists) throw new Error('Level not found')

    const id = db.collection(COLLECTIONS.CLASS).doc().id
    const newClass = {
      ...validated,
      currentCount: 0,
      program: profileHelper.getProgramSnapshot(validated.programId, programDoc.data()),
      teacher: profileHelper.getTeacherSnapshot(validated.teacherId, teacherDoc.data()),
      branch: profileHelper.getBranchSnapshot(validated.branchId, branchDoc.data()),
      term: profileHelper.getTermSnapshot(validated.termId, termDoc.data()),
      level: profileHelper.getLevelSnapshot(validated.levelId, levelDoc.data()),
      createdAt: new Date().toISOString(),
    }

    await db.collection(COLLECTIONS.CLASS).doc(id).set(newClass)
    return { id, ...newClass }
  }

  async getAllClasses(filters = {}) {
    let query = db.collection(COLLECTIONS.CLASS)
    if (filters.programId) query = query.where('programId', '==', filters.programId)
    if (filters.branchId) query = query.where('branchId', '==', filters.branchId)
    if (filters.termId) query = query.where('termId', '==', filters.termId)
    if (filters.status) query = query.where('status', '==', filters.status)

    const snapshot = await query.get()
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  }

  async getClass(id) {
    const doc = await db.collection(COLLECTIONS.CLASS).doc(id).get()
    if (!doc.exists) throw new Error('Class not found')
    return { id: doc.id, ...doc.data() }
  }

  async updateClass(id, updateData) {
    const validated = validateUpdateClass(updateData)
    const ref = db.collection(COLLECTIONS.CLASS).doc(id)

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(ref)
      if (!doc.exists) throw new Error('Class not found')

      const currentData = doc.data()
      transaction.update(ref, { ...validated, updatedAt: new Date().toISOString() })

      const syncNeeded = validated.schedule || validated.capacity !== undefined
      if (syncNeeded) {
        const newData = { ...currentData, ...validated }
        const snapshot = profileHelper.getClassSnapshot(id, newData)
        await require('./enrollmentService').syncEnrollmentsWithClass(id, snapshot)
      }
    })

    return { id, message: 'Class updated successfully' }
  }

  async deleteClass(id) {
    const ref = db.collection(COLLECTIONS.CLASS).doc(id)
    const doc = await ref.get()
    if (!doc.exists) throw new Error('Class not found')

    if (doc.data().currentCount > 0) {
      throw new Error('Cannot delete class with active enrollments')
    }

    await ref.delete()
    return { message: 'Class deleted successfully' }
  }

  // --- Operational Utilities ---

  async duplicateClassesFromTerm(sourceTermId, targetTermId, branchId = null) {
    let query = db.collection(COLLECTIONS.CLASS).where('termId', '==', sourceTermId)
    if (branchId) query = query.where('branchId', '==', branchId)

    const snapshot = await query.get()
    if (snapshot.empty) throw new Error('No classes found in source term')

    const targetTermDoc = await db.collection(COLLECTIONS.TERM).doc(targetTermId).get()
    if (!targetTermDoc.exists) throw new Error('Target term not found')

    const targetTermSnapshot = profileHelper.getTermSnapshot(targetTermId, targetTermDoc.data())
    const batch = db.batch()
    let count = 0

    snapshot.docs.forEach((doc) => {
      const data = doc.data()
      const newId = db.collection(COLLECTIONS.CLASS).doc().id
      const duplicatedClass = {
        ...data,
        termId: targetTermId,
        term: targetTermSnapshot,
        currentCount: 0,
        createdAt: new Date().toISOString(),
      }
      delete duplicatedClass.updatedAt
      batch.set(db.collection(COLLECTIONS.CLASS).doc(newId), duplicatedClass)
      count++
    })

    await batch.commit()
    return { message: `Successfully duplicated ${count} classes`, count }
  }

  async syncStudentCount(classId) {
    const enrollmentsSnap = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where('classId', '==', classId)
      .where('status', '==', 'active')
      .get()

    const count = enrollmentsSnap.size
    await db.collection(COLLECTIONS.CLASS).doc(classId).update({ currentCount: count })
    return { classId, count }
  }

  async syncAllClassCounts() {
    const classesSnap = await db.collection(COLLECTIONS.CLASS).get()
    let updated = 0

    for (const cDoc of classesSnap.docs) {
      await this.syncStudentCount(cDoc.id)
      updated++
    }
    return { message: `Synchronized ${updated} classes` }
  }

  async validateCapacity(classId) {
    const classDoc = await db.collection(COLLECTIONS.CLASS).doc(classId).get()
    if (!classDoc.exists) throw new Error('Class not found')

    const { currentCount, capacity } = classDoc.data()
    return { isAvailable: currentCount < capacity, remaining: Math.max(0, capacity - currentCount) }
  }

  async syncClassesWithProgram(programId, programSnapshot) {
    const snapshot = await db.collection(COLLECTIONS.CLASS).where('programId', '==', programId).get()
    if (snapshot.empty) return

    const batch = db.batch()
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { program: programSnapshot, updatedAt: new Date().toISOString() })
    })
    await batch.commit()

    const enrollmentService = require('./enrollmentService')
    for (const doc of snapshot.docs) {
      const classData = { ...doc.data(), program: programSnapshot }
      const classSnapshot = profileHelper.getClassSnapshot(doc.id, classData)
      await enrollmentService.syncEnrollmentsWithClass(doc.id, classSnapshot)
    }
  }
}

module.exports = new ClassService()

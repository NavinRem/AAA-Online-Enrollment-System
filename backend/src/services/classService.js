const { db, COLLECTIONS } = require('../config/database')
const profileHelper = require('../utils/profileHelper')
const { validateClass, validateUpdateClass } = require('../validators/classValidator')

class ClassService {
  async createClass(classData) {
    const validatedData = validateClass(classData)
    const { programId, termId, branchId, teacherId } = validatedData

    const [programDoc, termDoc, branchDoc, teacherDoc] = await Promise.all([
      db.collection(COLLECTIONS.PROGRAM).doc(programId).get(),
      db.collection(COLLECTIONS.TERM).doc(termId).get(),
      db.collection(COLLECTIONS.BRANCH).doc(branchId).get(),
      db.collection(COLLECTIONS.TEACHER).doc(teacherId).get(),
    ])

    if (!programDoc.exists) throw new Error('Program not found')
    if (!termDoc.exists) throw new Error('Term not found')
    if (!branchDoc.exists) throw new Error('Branch not found')
    if (!teacherDoc.exists) throw new Error('Teacher not found')

    const pData = programDoc.data()
    const tData = termDoc.data()
    const bData = branchDoc.data()
    const uData = teacherDoc.data()

    const data = {
      ...validatedData,
      program: profileHelper.getProgramSnapshot(programId, pData),
      term: profileHelper.getTermSnapshot(termId, tData),
      branch: profileHelper.getBranchSnapshot(branchId, bData),
      teacher: profileHelper.getUserSnapshot(teacherId, uData),
    }

    const docRef = await db.collection(COLLECTIONS.CLASS).add(data)

    const branchService = require('./branchService')
    await branchService.calculateAndSyncStats(branchId)

    return { id: docRef.id, ...data }
  }

  async getAllClasses(filters = {}) {
    let query = db.collection(COLLECTIONS.CLASS)

    if (filters.termId) query = query.where('termId', '==', filters.termId)
    if (filters.branchId)
      query = query.where('branchId', '==', filters.branchId)
    if (filters.programId)
      query = query.where('programId', '==', filters.programId)
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
    const validatedUpdate = validateUpdateClass(updateData)
    const ref = db.collection(COLLECTIONS.CLASS).doc(id)
    const doc = await ref.get()
    if (!doc.exists) throw new Error('Class not found')

    if (validatedUpdate.teacherId) {
      const teacherDoc = await db
        .collection(COLLECTIONS.TEACHER)
        .doc(validatedUpdate.teacherId)
        .get()
      if (teacherDoc.exists) {
        validatedUpdate.teacher = profileHelper.getUserSnapshot(
          validatedUpdate.teacherId,
          teacherDoc.data(),
        )
      }
    }

    await ref.update(validatedUpdate)

    // Trigger cascading sync to Enrollments
    const updatedDoc = await ref.get()
    const enrollmentService = require('./enrollmentService')
    const classSnapshot = profileHelper.getClassSnapshot(id, updatedDoc.data())
    await enrollmentService.syncEnrollmentsWithClass(id, classSnapshot)

    if (validatedUpdate.branchId || doc.data().branchId) {
      const branchService = require('./branchService')
      if (validatedUpdate.branchId)
        await branchService.calculateAndSyncStats(validatedUpdate.branchId)
      if (
        doc.data().branchId &&
        doc.data().branchId !== validatedUpdate.branchId
      ) {
        await branchService.calculateAndSyncStats(doc.data().branchId)
      }
    }

    return { id, ...validatedUpdate }
  }

  /**
   * Sync all classes when a program snapshot changes
   */
  async syncClassesWithProgram(programId, programSnapshot) {
    const snapshot = await db.collection(COLLECTIONS.CLASS)
      .where('programId', '==', programId)
      .get()
    
    if (snapshot.empty) return

    const batch = db.batch()
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { 
        program: programSnapshot,
        updatedAt: new Date().toISOString()
      })
    })
    await batch.commit()
    console.log(`🔄 Synced Program snapshot to ${snapshot.size} Classes`)

    // Propagate to Enrollments
    for (const doc of snapshot.docs) {
      const classData = { ...doc.data(), program: programSnapshot }
      const enrollmentService = require('./enrollmentService')
      const classSnapshot = profileHelper.getClassSnapshot(doc.id, classData)
      await enrollmentService.syncEnrollmentsWithClass(doc.id, classSnapshot)
    }
  }

  async deleteClass(id) {
    const doc = await db.collection(COLLECTIONS.CLASS).doc(id).get()
    if (!doc.exists) throw new Error('Class not found')

    const branchId = doc.data().branchId
    await db.collection(COLLECTIONS.CLASS).doc(id).delete()

    if (branchId) {
      const branchService = require('./branchService')
      await branchService.calculateAndSyncStats(branchId)
    }

    return { message: 'Class deleted successfully' }
  }

  async duplicateClassesFromTerm(sourceTermId, targetTermId, branchId = null) {
    let query = db
      .collection(COLLECTIONS.CLASS)
      .where('termId', '==', sourceTermId)
    if (branchId) query = query.where('branchId', '==', branchId)

    const snapshot = await query.get()
    if (snapshot.empty)
      return { message: 'No classes found to duplicate', count: 0 }

    const targetTermDoc = await db
      .collection(COLLECTIONS.TERM)
      .doc(targetTermId)
      .get()
    if (!targetTermDoc.exists) throw new Error('Target Term not found')

    const termSnapshot = profileHelper.getTermSnapshot(
      targetTermId,
      targetTermDoc.data(),
    )
    const results = []
    const batch = db.batch()

    for (const doc of snapshot.docs) {
      const oldData = doc.data()
      const newClassRef = db.collection(COLLECTIONS.CLASS).doc()

      const newData = {
        ...oldData,
        termId: targetTermId,
        term: termSnapshot,
        enrolledCount: 0,
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      delete newData.id
      batch.set(newClassRef, newData)
      results.push(newClassRef.id)
    }

    await batch.commit()

    const branchIds = [...new Set(snapshot.docs.map((d) => d.data().branchId))]
    const branchService = require('./branchService')
    for (const bId of branchIds) {
      await branchService.calculateAndSyncStats(bId)
    }

    return {
      message: 'Classes duplicated successfully',
      count: results.length,
      ids: results,
    }
  }

  async syncStudentCount(classId) {
    const enrollmentSnapshot = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where('classId', '==', classId)
      .get()

    const activeCount = enrollmentSnapshot.docs.filter((doc) => {
      const status = doc.data().status.toLowerCase()
      return !['cancelled', 'canceled'].includes(status)
    }).length

    await db.collection(COLLECTIONS.CLASS).doc(classId).update({
      enrolledCount: activeCount,
      updatedAt: new Date().toISOString(),
    })

    return { id: classId, enrolledCount: activeCount }
  }

  async validateCapacity(classId) {
    const doc = await db.collection(COLLECTIONS.CLASS).doc(classId).get()
    if (!doc.exists) throw new Error('Class not found')

    const data = doc.data()
    const enrolledCount = data.enrolledCount || 0
    const maxCapacity = data.maxCapacity || 0
    const available = enrolledCount < maxCapacity

    return {
      id: classId,
      hasCapacity: available,
      current: enrolledCount,
      maxCapacity: maxCapacity,
    }
  }

  async syncAllClassCounts() {
    const snapshot = await db.collection(COLLECTIONS.CLASS).get()
    const results = []

    for (const doc of snapshot.docs) {
      try {
        const result = await this.syncStudentCount(doc.id)
        results.push(result)
      } catch (err) {
        console.error(`Failed to sync class ${doc.id}:`, err)
      }
    }

    return {
      message: `Synchronized ${results.length} classes`,
      details: results,
    }
  }
}

module.exports = new ClassService()

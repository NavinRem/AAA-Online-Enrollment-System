const { db, COLLECTIONS } = require('../config/database')
const profileHelper = require('../utils/profileHelper')

class ClassService {
  /**
   * Create a new Class instance
   * Joins Program, Term, Branch, Teacher, and Schedule
   */
  async createClass(classData) {
    const {
      programId,
      termId,
      branchId,
      teacherId,
      day,
      timeslot,
      scheduleType,
      status,
      adminNote,
      price,
      capacity,
    } = classData

    if (!programId || !termId || !branchId) {
      throw new Error(
        'Program, Term, and Branch are required to create a class',
      )
    }

    // 1. Fetch related docs for snapshots
    const [programDoc, termDoc, branchDoc, teacherDoc] = await Promise.all([
      db.collection(COLLECTIONS.PROGRAM).doc(programId).get(),
      db.collection(COLLECTIONS.TERM).doc(termId).get(),
      db.collection(COLLECTIONS.BRANCH).doc(branchId).get(),
      teacherId
        ? db.collection(COLLECTIONS.TEACHER).doc(teacherId).get()
        : Promise.resolve({ exists: false, data: () => null }),
    ])

    if (!programDoc.exists) throw new Error('Program not found')
    if (!termDoc.exists) throw new Error('Term not found')
    if (!branchDoc.exists) throw new Error('Branch not found')

    const pData = programDoc.data()
    const tData = termDoc.data()
    const bData = branchDoc.data()
    const uData = teacherDoc.exists ? teacherDoc.data() : null

    // 2. Build the Class document with Snapshots
    const data = {
      programId,
      termId,
      branchId,
      teacherId: teacherId || null,

      program: profileHelper.getProgramSnapshot(programId, pData),
      term: profileHelper.getTermSnapshot(termId, tData),
      branch: profileHelper.getBranchSnapshot(branchId, bData),
      teacher: uData ? profileHelper.getUserSnapshot(teacherId, uData) : null,

      day: day || 'TBD',
      timeslot: timeslot || 'TBD',
      scheduleType: scheduleType || 'fix',
      status: status || 'open',
      adminNote: adminNote || '',

      price: parseFloat(price !== undefined ? price : pData.basePrice || 0),
      capacity: parseInt(
        capacity !== undefined ? capacity : pData.maxCapacity || 15,
      ),

      numStudent: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
    const ref = db.collection(COLLECTIONS.CLASS).doc(id)
    const doc = await ref.get()
    if (!doc.exists) throw new Error('Class not found')

    const data = {
      ...updateData,
      updatedAt: new Date().toISOString(),
    }

    if (updateData.teacherId) {
      const teacherDoc = await db
        .collection(COLLECTIONS.TEACHER)
        .doc(updateData.teacherId)
        .get()
      if (teacherDoc.exists) {
        data.teacher = profileHelper.getUserSnapshot(
          updateData.teacherId,
          teacherDoc.data(),
        )
      }
    }

    await ref.update(data)

    if (updateData.branchId || doc.data().branchId) {
      const branchService = require('./branchService')
      if (updateData.branchId)
        await branchService.calculateAndSyncStats(updateData.branchId)
      if (doc.data().branchId && doc.data().branchId !== updateData.branchId) {
        await branchService.calculateAndSyncStats(doc.data().branchId)
      }
    }

    return { id, ...data }
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
        numStudent: 0,
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

  /**
   * Synchronize student count for a class based on active enrollments
   */
  async syncStudentCount(classId) {
    const enrollmentSnapshot = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where('classId', '==', classId)
      .get()

    const activeCount = enrollmentSnapshot.docs.filter((doc) => {
      const status = (doc.data().status || '').toLowerCase()
      return !['cancelled', 'canceled'].includes(status)
    }).length

    await db.collection(COLLECTIONS.CLASS).doc(classId).update({
      numStudent: activeCount,
      updatedAt: new Date().toISOString(),
    })

    return activeCount
  }
}

module.exports = new ClassService()

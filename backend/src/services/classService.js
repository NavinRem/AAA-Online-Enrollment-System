const { db, COLLECTIONS } = require('../config/database')
const profileHelper = require('../utils/profileHelper')
const {
  validateClass,
  validateUpdateClass,
} = require('../validators/classValidator')

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

    const data = {
      ...validatedData,
      program: profileHelper.getProgramSnapshot(programId, programDoc.data()),
      term: profileHelper.getTermSnapshot(termId, termDoc.data()),
      branch: profileHelper.getBranchSnapshot(branchId, branchDoc.data()),
      teacher: profileHelper.getTeacherSnapshot(teacherId, teacherDoc.data()),
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
    if (!id) throw new Error('Class ID is required')
    const doc = await db.collection(COLLECTIONS.CLASS).doc(id).get()
    if (!doc.exists) throw new Error('Class not found')
    return { id: doc.id, ...doc.data() }
  }

  async updateClass(id, updateData) {
    if (!id) throw new Error('Class ID is required')
    const validatedUpdate = validateUpdateClass(updateData)
    const classRef = db.collection(COLLECTIONS.CLASS).doc(id)
    const classDoc = await classRef.get()

    if (!classDoc.exists) throw new Error('Class not found')
    const currentData = classDoc.data()

    if (
      validatedUpdate.programId &&
      validatedUpdate.programId !== currentData.programId
    ) {
      const pDoc = await db
        .collection(COLLECTIONS.PROGRAM)
        .doc(validatedUpdate.programId)
        .get()
      if (pDoc.exists)
        validatedUpdate.program = profileHelper.getProgramSnapshot(
          pDoc.id,
          pDoc.data(),
        )
    }
    if (
      validatedUpdate.termId &&
      validatedUpdate.termId !== currentData.termId
    ) {
      const tDoc = await db
        .collection(COLLECTIONS.TERM)
        .doc(validatedUpdate.termId)
        .get()
      if (tDoc.exists)
        validatedUpdate.term = profileHelper.getTermSnapshot(
          tDoc.id,
          tDoc.data(),
        )
    }
    if (
      validatedUpdate.branchId &&
      validatedUpdate.branchId !== currentData.branchId
    ) {
      const bDoc = await db
        .collection(COLLECTIONS.BRANCH)
        .doc(validatedUpdate.branchId)
        .get()
      if (bDoc.exists)
        validatedUpdate.branch = profileHelper.getBranchSnapshot(
          bDoc.id,
          bDoc.data(),
        )
    }
    if (
      validatedUpdate.teacherId &&
      validatedUpdate.teacherId !== currentData.teacherId
    ) {
      const uDoc = await db
        .collection(COLLECTIONS.TEACHER)
        .doc(validatedUpdate.teacherId)
        .get()
      if (uDoc.exists)
        validatedUpdate.teacher = profileHelper.getTeacherSnapshot(
          uDoc.id,
          uDoc.data(),
        )
    }

    await classRef.update(validatedUpdate)

    const freshDoc = await classRef.get()
    const classSnapshot = profileHelper.getClassSnapshot(id, freshDoc.data())
    const enrollmentService = require('./enrollmentService')
    await enrollmentService.syncEnrollmentsWithClass(id, classSnapshot)
    const branchService = require('./branchService')
    if (validatedUpdate.branchId) {
      await branchService.calculateAndSyncStats(validatedUpdate.branchId)
      if (
        currentData.branchId &&
        currentData.branchId !== validatedUpdate.branchId
      ) {
        await branchService.calculateAndSyncStats(currentData.branchId)
      }
    } else {
      await branchService.calculateAndSyncStats(currentData.branchId)
    }

    return { id, ...validatedUpdate }
  }

  async deleteClass(id) {
    if (!id) throw new Error('Class ID is required for deletion')
    const classRef = db.collection(COLLECTIONS.CLASS).doc(id)
    const classDoc = await classRef.get()
    if (!classDoc.exists) throw new Error('Class not found')

    const { branchId } = classDoc.data()

    const batch = db.batch()
    batch.delete(classRef)

    const enrollmentsSnap = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where('classId', '==', id)
      .get()

    enrollmentsSnap.forEach((doc) => {
      batch.update(doc.ref, {
        classId: null,
        class: null,
        updatedAt: new Date().toISOString(),
      })
    })

    await batch.commit()

    if (branchId) {
      const branchService = require('./branchService')
      await branchService.calculateAndSyncStats(branchId)
    }

    return { message: 'Class deleted successfully' }
  }

  async syncClassesWithProgram(programId, programSnapshot) {
    const snapshot = await db
      .collection(COLLECTIONS.CLASS)
      .where('programId', '==', programId)
      .get()

    if (snapshot.empty) return

    const batch = db.batch()
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        program: programSnapshot,
        updatedAt: new Date().toISOString(),
      })
    })
    await batch.commit()

    const enrollmentService = require('./enrollmentService')
    for (const doc of snapshot.docs) {
      const classData = { ...doc.data(), program: programSnapshot }
      const classSnapshot = profileHelper.getClassSnapshot(doc.id, classData)
      await enrollmentService.syncEnrollmentsWithClass(doc.id, classSnapshot)
    }
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
      return status !== 'cancelled'
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
    return {
      id: classId,
      hasCapacity: enrolledCount < maxCapacity,
      current: enrolledCount,
      maxCapacity: maxCapacity,
    }
  }
}

module.exports = new ClassService()

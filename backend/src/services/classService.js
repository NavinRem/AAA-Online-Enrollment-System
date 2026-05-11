const { db, COLLECTIONS } = require('../config/database')
const profileHelper = require('../utils/profileHelper')
const {
  validateClass,
  validateUpdateClass,
} = require('../validators/classValidator')

class ClassService {
  async createClass(classData) {
    const validated = validateClass(classData)
    const [programDoc, scheduleDocs] = await Promise.all([
      db.collection(COLLECTIONS.PROGRAM).doc(validated.programId).get(),
      this.getScheduleDocs(validated.scheduleIds),
    ])

    if (!programDoc.exists) throw new Error('Program not found')
    if (scheduleDocs.some((d) => !d.exists || d.data().isDeleted)) {
      throw new Error('One or more schedules not found')
    }

    const duplicateSnap = await db
      .collection(COLLECTIONS.CLASS)
      .where('programId', '==', validated.programId)
      .where('isDeleted', '==', false)
      .limit(1)
      .get()
    if (!duplicateSnap.empty) {
      throw new Error('A class product already exists for this program')
    }

    const schedules = scheduleDocs.map((doc) => this.getScheduleSnapshot(doc.id, doc.data()))
    const newClass = {
      programId: validated.programId,
      program: profileHelper.getProgramSnapshot(validated.programId, programDoc.data()),
      scheduleIds: validated.scheduleIds,
      schedules,
      status: validated.status,
      isDeleted: false,
      createdAt: validated.createdAt,
      updatedAt: validated.updatedAt,
    }

    const docRef = await db.collection(COLLECTIONS.CLASS).add(newClass)
    return { id: docRef.id, ...newClass }
  }

  async getAllClasses(filters = {}) {
    let query = db.collection(COLLECTIONS.CLASS)
    if (filters.programId) query = query.where('programId', '==', filters.programId)
    if (filters.status) query = query.where('status', '==', filters.status)

    const snapshot = await query.get()
    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((c) => c.isDeleted !== true)
  }

  async getClass(id) {
    const doc = await db.collection(COLLECTIONS.CLASS).doc(id).get()
    if (!doc.exists || doc.data().isDeleted) throw new Error('Class not found')
    return { id: doc.id, ...doc.data() }
  }

  async updateClass(id, updateData) {
    const validated = validateUpdateClass(updateData)
    const ref = db.collection(COLLECTIONS.CLASS).doc(id)
    const doc = await ref.get()

    if (!doc.exists || doc.data().isDeleted) throw new Error('Class not found')
    const currentData = doc.data()
    const updates = { ...validated }

    if (validated.programId && validated.programId !== currentData.programId) {
      const existing = await db
        .collection(COLLECTIONS.CLASS)
        .where('programId', '==', validated.programId)
        .where('isDeleted', '==', false)
        .limit(1)
        .get()

      if (!existing.empty && existing.docs[0].id !== id) {
        throw new Error('A class product already exists for this program')
      }

      const pDoc = await db.collection(COLLECTIONS.PROGRAM).doc(validated.programId).get()
      if (!pDoc.exists) throw new Error('Program not found')
      updates.program = profileHelper.getProgramSnapshot(validated.programId, pDoc.data())
    }

    if (validated.scheduleIds) {
      const scheduleDocs = await this.getScheduleDocs(validated.scheduleIds)
      if (scheduleDocs.some((d) => !d.exists || d.data().isDeleted)) {
        throw new Error('One or more schedules not found')
      }
      updates.schedules = scheduleDocs.map((scheduleDoc) =>
        this.getScheduleSnapshot(scheduleDoc.id, scheduleDoc.data()),
      )
    }

    await ref.update(updates)

    const nextClass = { ...currentData, ...updates, id }
    await this.syncTermsWithClass(id, nextClass)
    await require('./enrollmentService').syncEnrollmentsWithClass(
      id,
      profileHelper.getClassSnapshot(id, nextClass),
    )

    return { id, message: 'Class updated successfully' }
  }

  async deleteClass(id) {
    const ref = db.collection(COLLECTIONS.CLASS).doc(id)
    const doc = await ref.get()
    if (!doc.exists) throw new Error('Class not found')

    await ref.update({
      isDeleted: true,
      status: 'deleted',
      updatedAt: new Date().toISOString(),
    })

    return { message: 'Class deleted successfully (Soft delete)' }
  }

  async getScheduleDocs(scheduleIds) {
    return Promise.all(
      scheduleIds.map((scheduleId) =>
        db.collection(COLLECTIONS.SCHEDULE).doc(scheduleId).get(),
      ),
    )
  }

  getScheduleSnapshot(scheduleId, data) {
    return {
      id: scheduleId,
      day: data.day,
      time: data.time,
    }
  }

  async syncClassesWithProgram(programId, programSnapshot) {
    const snapshot = await db
      .collection(COLLECTIONS.CLASS)
      .where('programId', '==', programId)
      .get()
    if (snapshot.empty) return

    const firestoreHelper = require('../utils/firestoreHelper')
    const writes = snapshot.docs.map((doc) => ({
      ref: doc.ref,
      data: {
        program: programSnapshot,
        updatedAt: new Date().toISOString(),
      },
    }))
    await firestoreHelper.chunkedUpdate(writes)

    for (const doc of snapshot.docs) {
      await this.syncTermsWithClass(doc.id, { ...doc.data(), program: programSnapshot, id: doc.id })
      const classSnapshot = profileHelper.getClassSnapshot(doc.id, { ...doc.data(), program: programSnapshot })
      await require('./enrollmentService').syncEnrollmentsWithClass(doc.id, classSnapshot)
    }
  }

  async syncTermsWithClass(classId, classData) {
    const termSnap = await db.collection(COLLECTIONS.TERM).get()
    const writes = []

    termSnap.forEach((termDoc) => {
      const termData = termDoc.data()
      const offerings = (termData.offerings || []).map((offering) => {
        if (offering.classId !== classId) return offering
        return {
          ...offering,
          program: classData.program || offering.program,
        }
      })

      if (JSON.stringify(offerings) !== JSON.stringify(termData.offerings || [])) {
        writes.push({ ref: termDoc.ref, data: { offerings, updatedAt: new Date().toISOString() } })
      }
    })

    if (writes.length > 0) {
      const firestoreHelper = require('../utils/firestoreHelper')
      await firestoreHelper.chunkedUpdate(writes)
    }
  }

  async syncStudentCount() {
    return { message: 'Class products do not store student counts. Counts are derived from term offerings.' }
  }

  async syncAllClassCounts() {
    return { message: 'Class products do not store student counts. Counts are derived from term offerings.' }
  }

  async validateCapacity() {
    return { isAvailable: true, remaining: null }
  }
}

module.exports = new ClassService()

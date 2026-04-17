const { db, COLLECTIONS } = require('../config/database')
const {
  validateProgram,
  validateUpdateProgram,
} = require('../validators/programValidator')

class ProgramService {
  /**
   * Create a new Program (Model Product)
   */
  async createProgram(programData) {
    const validatedData = validateProgram(programData)
    const { categoryId, levelId } = validatedData

    if (categoryId) {
      const catDoc = await db
        .collection(COLLECTIONS.CATEGORY)
        .doc(categoryId)
        .get()
      if (catDoc.exists) validatedData.category = catDoc.data().name
    }
    if (levelId) {
      const levelDoc = await db.collection(COLLECTIONS.LEVEL).doc(levelId).get()
      if (levelDoc.exists) validatedData.level = levelDoc.data().name
    }

    const docRef = await db.collection(COLLECTIONS.PROGRAM).add(validatedData)
    return { id: docRef.id, ...validatedData }
  }

  /**
   * Get all Programs (Products)
   */
  async getAllPrograms() {
    const snapshot = await db.collection(COLLECTIONS.PROGRAM).get()
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  }

  async getProgram(id) {
    const doc = await db.collection(COLLECTIONS.PROGRAM).doc(id).get()
    if (!doc.exists) throw new Error('Program not found')
    return { id: doc.id, ...doc.data() }
  }

  async updateProgram(id, updateData) {
    const validatedUpdate = validateUpdateProgram(updateData)
    const ref = db.collection(COLLECTIONS.PROGRAM).doc(id)
    const doc = await ref.get()
    if (!doc.exists) throw new Error('Program not found')

    if (validatedUpdate.categoryId) {
      const catDoc = await db
        .collection(COLLECTIONS.CATEGORY)
        .doc(validatedUpdate.categoryId)
        .get()
      if (catDoc.exists) validatedUpdate.category = catDoc.data().name
    }
    if (validatedUpdate.levelId) {
      const levelDoc = await db
        .collection(COLLECTIONS.LEVEL)
        .doc(validatedUpdate.levelId)
        .get()
      if (levelDoc.exists) validatedUpdate.level = levelDoc.data().name
    }

    await ref.update(validatedUpdate)

    const updatedDoc = await ref.get()
    const classService = require('./classService')
    const profileHelper = require('../utils/profileHelper')
    const programSnapshot = profileHelper.getProgramSnapshot(
      id,
      updatedDoc.data(),
    )
    await classService.syncClassesWithProgram(id, programSnapshot)

    return { id, ...validatedUpdate }
  }

  /**
   * Sync all programs when a category name changes
   */
  async syncProgramsWithCategory(categoryId, categoryName) {
    const snapshot = await db
      .collection(COLLECTIONS.PROGRAM)
      .where('categoryId', '==', categoryId)
      .get()

    if (snapshot.empty) return

    const batch = db.batch()
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        category: categoryName,
        updatedAt: new Date().toISOString(),
      })
    })
    await batch.commit()
    console.log(
      `🔄 Synced Category name "${categoryName}" to ${snapshot.size} Programs`,
    )

    for (const doc of snapshot.docs) {
      const programData = { ...doc.data(), category: categoryName }
      const profileHelper = require('../utils/profileHelper')
      const classService = require('./classService')
      const programSnapshot = profileHelper.getProgramSnapshot(
        doc.id,
        programData,
      )
      await classService.syncClassesWithProgram(doc.id, programSnapshot)
    }
  }

  async deleteProgram(id) {
    await db.collection(COLLECTIONS.PROGRAM).doc(id).delete()
    return { message: 'Program deleted successfully' }
  }

  async addSchedule(programId, scheduleData) {
    const { day, timeslot } = scheduleData
    if (!day || !timeslot) throw new Error('Day and Timeslot are required')

    const docRef = await db
      .collection(COLLECTIONS.PROGRAM)
      .doc(programId)
      .collection(COLLECTIONS.SCHEDULE)
      .add({
        day,
        timeslot,
        createdAt: new Date().toISOString(),
      })

    return { id: docRef.id, day, timeslot }
  }

  async getSchedules(programId) {
    const snapshot = await db
      .collection(COLLECTIONS.PROGRAM)
      .doc(programId)
      .collection(COLLECTIONS.SCHEDULE)
      .get()

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  }

  async removeSchedule(programId, scheduleId) {
    await db
      .collection(COLLECTIONS.PROGRAM)
      .doc(programId)
      .collection(COLLECTIONS.SCHEDULE)
      .doc(scheduleId)
      .delete()
    return { message: 'Schedule removed' }
  }
}

module.exports = new ProgramService()

const { db, COLLECTIONS } = require('../config/database')
const profileHelper = require('../utils/profileHelper')

class ProgramService {
  /**
   * Create a new Program (Model Product)
   */
  async createProgram(programData) {
    const {
      name,
      categoryId,
      description,
      sessionNumber,
      weeksNumber,
      basePrice,
      maxCapacity,
      type,
      profileURL,
      levelId,
    } = programData

    if (!name || !categoryId) {
      throw new Error('Program Name and Category are required')
    }

    // Authoritative check for Category Name
    const catDoc = await db
      .collection(COLLECTIONS.CATEGORY)
      .doc(categoryId)
      .get()
    if (!catDoc.exists) throw new Error('Category not found')
    const categoryName = catDoc.data().name

    // Authoritative check for Level Name
    let levelName = null
    if (levelId) {
      const lvlDoc = await db
        .collection(COLLECTIONS.CATEGORY)
        .doc(categoryId)
        .collection(COLLECTIONS.LEVEL)
        .doc(levelId)
        .get()
      if (lvlDoc.exists) levelName = lvlDoc.data().name
    }

    const data = {
      name: name.trim(),
      categoryId,
      category: categoryName,
      description: description || '',
      levelId: levelId || null,
      level: levelName,
      sessionNumber: parseInt(sessionNumber || 0),
      weeksNumber: parseInt(weeksNumber || 0),
      basePrice: parseFloat(basePrice || 0),
      maxCapacity: parseInt(maxCapacity || 15),
      type: type || 'group',
      profileURL: profileURL || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const docRef = await db.collection(COLLECTIONS.PROGRAM).add(data)
    return { id: docRef.id, ...data }
  }

  /**
   * Get all Programs (Products)
   */
  async getAllPrograms() {
    const snapshot = await db.collection(COLLECTIONS.PROGRAM).get()
    const programs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return this._hydratePrograms(programs)
  }

  async getProgram(id) {
    const doc = await db.collection(COLLECTIONS.PROGRAM).doc(id).get()
    if (!doc.exists) throw new Error('Program not found')

    const programs = [{ id: doc.id, ...doc.data() }]
    const hydrated = await this._hydratePrograms(programs)
    return hydrated[0]
  }

  /**
   * Hydrates category and level names
   */
  async _hydratePrograms(programs) {
    if (!programs || programs.length === 0) return []

    const categoriesSnapshot = await db.collection(COLLECTIONS.CATEGORY).get()
    const categoriesMap = {}
    const levelsMap = {}

    categoriesSnapshot.docs.forEach((doc) => {
      categoriesMap[doc.id] = doc.data().name
    })

    await Promise.all(
      categoriesSnapshot.docs.map(async (catDoc) => {
        const levelsSnapshot = await catDoc.ref
          .collection(COLLECTIONS.LEVEL)
          .get()
        levelsSnapshot.docs.forEach((lvlDoc) => {
          levelsMap[lvlDoc.id] = lvlDoc.data().name
        })
      }),
    )

    return programs.map((p) => {
      return {
        ...p,
        name: p.name,
        category: categoriesMap[p.categoryId] || p.category,
        levelName: levelsMap[p.levelId] || p.level,
        profileURL: p.profileURL,
      }
    })
  }

  async updateProgram(id, updateData) {
    const ref = db.collection(COLLECTIONS.PROGRAM).doc(id)
    const updates = { ...updateData }

    // If ID changed, fetch authoritative name
    if (updateData.categoryId) {
      const catDoc = await db
        .collection(COLLECTIONS.CATEGORY)
        .doc(updateData.categoryId)
        .get()
      if (catDoc.exists) updates.category = catDoc.data().name
    }

    if (updateData.levelId && updateData.categoryId) {
      const lvlDoc = await db
        .collection(COLLECTIONS.CATEGORY)
        .doc(updateData.categoryId)
        .collection(COLLECTIONS.LEVEL)
        .doc(updateData.levelId)
        .get()
      if (lvlDoc.exists) updates.level = lvlDoc.data().name
    }

    updates.updatedAt = new Date().toISOString()
    await ref.set(updates, { merge: true })

    return { id, ...updates }
  }

  async deleteProgram(id) {
    await db.collection(COLLECTIONS.PROGRAM).doc(id).delete()
    return { message: 'Program deleted successfully' }
  }

  async addSchedule(programId, scheduleData) {
    const { day, timeslot } = scheduleData
    if (!day || !timeslot) throw new Error('Day and Timeslot are required')

    const ref = db
      .collection(COLLECTIONS.PROGRAM)
      .doc(programId)
      .collection(COLLECTIONS.SCHEDULE)

    const docRef = await ref.add({
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

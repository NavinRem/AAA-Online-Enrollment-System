const { db, COLLECTIONS } = require('../config/database')
const { validateLevel, validateUpdateLevel } = require('../validators/levelValidator')

class LevelService {
  async createLevel(levelData) {
    const validatedData = validateLevel(levelData)
    const { name } = validatedData

    const snapshot = await db.collection(COLLECTIONS.LEVEL).get()
    const exists = snapshot.docs.some(
      (doc) => doc.data().name.toLowerCase() === name.toLowerCase(),
    )

    if (exists) {
      throw new Error(`Level "${name}" already exists`)
    }

    const docRef = await db.collection(COLLECTIONS.LEVEL).add(validatedData)
    return { id: docRef.id, ...validatedData }
  }

  async getAllLevels() {
    const snapshot = await db.collection(COLLECTIONS.LEVEL).get()
    return snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((l) => l.isDeleted !== true)
  }

  async getLevel(id) {
    if (!id) throw new Error('Level ID is required')
    const doc = await db.collection(COLLECTIONS.LEVEL).doc(id).get()
    if (!doc.exists) throw new Error('Level not found')
    return { id: doc.id, ...doc.data() }
  }

  async updateLevel(id, data) {
    if (!id) throw new Error('Level ID is required')
    const validatedData = validateUpdateLevel(data)
    const levelRef = db.collection(COLLECTIONS.LEVEL).doc(id)
    const levelDoc = await levelRef.get()

    if (!levelDoc.exists) throw new Error('Level not found')

    await levelRef.update(validatedData)

    const programsSnap = await db
      .collection(COLLECTIONS.PROGRAM)
      .where('levelId', '==', id)
      .get()

    if (!programsSnap.empty) {
      const batch = db.batch()
      const profileHelper = require('../utils/profileHelper')

      programsSnap.forEach((pDoc) => {
        const updatedSnapshot = profileHelper.getLevelSnapshot(id, validatedData)
        batch.update(pDoc.ref, {
          level: validatedData.name,
          levelInfo: updatedSnapshot,
          updatedAt: new Date().toISOString(),
        })
      })
      await batch.commit()
    }

    return { id, ...validatedData }
  }

  async deleteLevel(id) {
    if (!id) throw new Error('Level ID is required for deletion')

    const levelRef = db.collection(COLLECTIONS.LEVEL).doc(id)
    const levelDoc = await levelRef.get()
    if (!levelDoc.exists) throw new Error('Level not found')

    await levelRef.update({
      isDeleted: true,
      status: 'deleted',
      updatedAt: new Date().toISOString(),
    })

    return { message: 'Level deleted successfully (Soft delete)' }
  }
}

module.exports = new LevelService()

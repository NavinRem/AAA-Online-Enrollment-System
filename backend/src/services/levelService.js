const { db, COLLECTIONS } = require('../config/database')
const { validateLevel } = require('../validators/academicValidator')

class LevelService {
  async getAllLevels(categoryId) {
    if (!categoryId) return []
    const snapshot = await db
      .collection(COLLECTIONS.CATEGORY)
      .doc(categoryId)
      .collection(COLLECTIONS.LEVEL)
      .get()
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  }

  async createLevel(categoryId, levelData) {
    if (!categoryId) throw new Error('Category ID is required')
    const validatedData = validateLevel(levelData)
    const { name } = validatedData

    const snapshot = await db
      .collection(COLLECTIONS.CATEGORY)
      .doc(categoryId)
      .collection(COLLECTIONS.LEVEL)
      .get()
    const exists = snapshot.docs.some(
      (doc) => doc.data().name.toLowerCase() === name.toLowerCase(),
    )

    if (exists) {
      throw new Error(`Level "${name}" already exists in this category`)
    }

    const docRef = await db
      .collection(COLLECTIONS.CATEGORY)
      .doc(categoryId)
      .collection(COLLECTIONS.LEVEL)
      .add(validatedData)
    return { id: docRef.id, ...validatedData }
  }


  async deleteLevel(categoryId, id) {
    await db
      .collection(COLLECTIONS.CATEGORY)
      .doc(categoryId)
      .collection(COLLECTIONS.LEVEL)
      .doc(id)
      .delete()
    return { message: 'Level deleted successfully' }
  }
}

module.exports = new LevelService()

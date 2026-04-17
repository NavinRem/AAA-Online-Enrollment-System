const { db, COLLECTIONS } = require('../config/database')
const { validateCategory } = require('../validators/academicValidator')

class CategoryService {
  async getAllCategories() {
    const snapshot = await db.collection(COLLECTIONS.CATEGORY).get()
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  }

  async createCategory(categoryData) {
    const validatedData = validateCategory(categoryData)
    const { name } = validatedData

    const snapshot = await db.collection(COLLECTIONS.CATEGORY).get()
    const exists = snapshot.docs.some(
      (doc) => doc.data().name.toLowerCase() === name.toLowerCase(),
    )

    if (exists) {
      throw new Error(`Category "${name}" already exists`)
    }

    const docRef = await db.collection(COLLECTIONS.CATEGORY).add(validatedData)
    return { id: docRef.id, ...validatedData }
  }

  async updateCategory(id, data) {
    const validatedData = validateCategory(data)
    const ref = db.collection(COLLECTIONS.CATEGORY).doc(id)
    const doc = await ref.get()

    if (!doc.exists) throw new Error('Category not found')

    await ref.update(validatedData)

    const programService = require('./programService')
    await programService.syncProgramsWithCategory(id, validatedData.name)

    return { id, ...validatedData }
  }

  async deleteCategory(id) {
    await db.collection(COLLECTIONS.CATEGORY).doc(id).delete()
    return { message: 'Category deleted successfully' }
  }
}

module.exports = new CategoryService()

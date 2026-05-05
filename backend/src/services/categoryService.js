const { db, COLLECTIONS } = require('../config/database')
const { validateCategory, validateUpdateCategory } = require('../validators/categoryValidator')

class CategoryService {
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

  async getAllCategories() {
    const snapshot = await db.collection(COLLECTIONS.CATEGORY).get()
    return snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((c) => c.isDeleted !== true)
  }

  async getCategory(id) {
    if (!id) throw new Error('Category ID is required')
    const doc = await db.collection(COLLECTIONS.CATEGORY).doc(id).get()
    if (!doc.exists) throw new Error('Category not found')
    return { id: doc.id, ...doc.data() }
  }

  async updateCategory(id, data) {
    if (!id) throw new Error('Category ID is required')
    const validatedData = validateUpdateCategory(data)
    const ref = db.collection(COLLECTIONS.CATEGORY).doc(id)
    const doc = await ref.get()

    if (!doc.exists) throw new Error('Category not found')

    await ref.update(validatedData)

    if (validatedData.name) {
      const programService = require('./programService')
      await programService.syncProgramsWithCategory(id, validatedData.name)
    }

    return { id, ...validatedData }
  }

  async deleteCategory(id) {
    if (!id) throw new Error('Category ID is required for deletion')
    const categoryRef = db.collection(COLLECTIONS.CATEGORY).doc(id)
    const categoryDoc = await categoryRef.get()
    if (!categoryDoc.exists) throw new Error('Category not found')

    await categoryRef.update({
      isDeleted: true,
      status: 'deleted',
      updatedAt: new Date().toISOString(),
    })

    return { message: 'Category deleted successfully (Soft delete)' }
  }
}

module.exports = new CategoryService()

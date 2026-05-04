const { db, COLLECTIONS } = require('../config/database')
const profileHelper = require('../utils/profileHelper')
const {
  validateProgram,
  validateUpdateProgram,
} = require('../validators/programValidator')

class ProgramService {
  async createProgram(programData) {
    const validated = validateProgram(programData)

    // Name Uniqueness Check
    const nameSnap = await db.collection(COLLECTIONS.PROGRAM)
      .where('name', '==', validated.name)
      .limit(1)
      .get()
    if (!nameSnap.empty) {
      throw new Error(`A program named "${validated.name}" already exists.`)
    }

    const id = db.collection(COLLECTIONS.PROGRAM).doc().id
    const program = { ...validated, createdAt: new Date().toISOString() }
    await db.collection(COLLECTIONS.PROGRAM).doc(id).set(program)
    return { id, ...program }
  }

  async getAllPrograms(filters = {}) {
    let query = db.collection(COLLECTIONS.PROGRAM)
    if (filters.status) query = query.where('status', '==', filters.status)
    if (filters.categoryId)
      query = query.where('categoryId', '==', filters.categoryId)

    const snapshot = await query.get()
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  }

  async getProgram(id) {
    const doc = await db.collection(COLLECTIONS.PROGRAM).doc(id).get()
    if (!doc.exists) throw new Error('Program not found')
    return { id: doc.id, ...doc.data() }
  }

  async updateProgram(id, updateData) {
    const validated = validateUpdateProgram(updateData)
    const ref = db.collection(COLLECTIONS.PROGRAM).doc(id)
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(ref)

      if (!doc.exists) throw new Error('Program not found')
      transaction.update(ref, {
        ...validated,
        updatedAt: new Date().toISOString(),
      })
      if (
        validated.name ||
        validated.description ||
        validated.price !== undefined
      ) {
        const newData = { ...doc.data(), ...validated }
        const snapshot = profileHelper.getProgramSnapshot(id, newData)
        const [classService, enrollmentService, trialService] = [
          require('./classService'),
          require('./enrollmentService'),
          require('./trialService'),
        ]
        await Promise.all([
          classService.syncClassesWithProgram(id, snapshot),
          enrollmentService.syncEnrollmentsWithProgram(id, snapshot),
          trialService.syncTrialsWithProgram(id, snapshot),
        ])
      }
    })
    return { id, message: 'Program updated successfully' }
  }

  async deleteProgram(id) {
    const ref = db.collection(COLLECTIONS.PROGRAM).doc(id)
    const doc = await ref.get()
    if (!doc.exists) throw new Error('Program not found')

    // Note: We allow hard deletion of the program even if classes exist, 
    // as per administrative requirement to preserve related data as historical orphans.

    await ref.delete()
    return { message: 'Program deleted successfully' }
  }

  async syncProgramsWithCategory(categoryId, categoryName) {
    const programsSnap = await db
      .collection(COLLECTIONS.PROGRAM)
      .where('categoryId', '==', categoryId)
      .get()

    if (!programsSnap.empty) {
      const batch = db.batch()
      const profileHelper = require('../utils/profileHelper')

      programsSnap.forEach((pDoc) => {
        const programData = { ...pDoc.data(), category: categoryName }
        const updatedSnapshot = profileHelper.getProgramSnapshot(pDoc.id, programData)
        batch.update(pDoc.ref, {
          category: categoryName,
          categoryInfo: updatedSnapshot.categoryInfo,
          updatedAt: new Date().toISOString(),
        })
      })
      await batch.commit()
    }
  }
}

module.exports = new ProgramService()

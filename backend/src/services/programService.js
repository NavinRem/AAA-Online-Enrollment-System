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
      .where('isDeleted', '==', false)
      .limit(1)
      .get()
    if (!nameSnap.empty) {
      throw new Error(`A program named "${validated.name}" already exists.`)
    }

    const id = db.collection(COLLECTIONS.PROGRAM).doc().id
    const program = {
      ...validated,
      totalEnrolledCount: 0,
      isDeleted: false,
      createdAt: new Date().toISOString(),
    }
    await db.collection(COLLECTIONS.PROGRAM).doc(id).set(program)
    return { id, ...program }
  }

  async getAllPrograms(filters = {}) {
    let query = db.collection(COLLECTIONS.PROGRAM)
    if (filters.status) query = query.where('status', '==', filters.status)
    if (filters.categoryId)
      query = query.where('categoryId', '==', filters.categoryId)

    const snapshot = await query.get()
    const results = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((p) => p.isDeleted !== true)

    return await this._enrichWithCategoryInfo(results)
  }

  async getProgram(id) {
    const doc = await db.collection(COLLECTIONS.PROGRAM).doc(id).get()
    if (!doc.exists) throw new Error('Program not found')
    const enriched = await this._enrichWithCategoryInfo([{ id: doc.id, ...doc.data() }])
    return enriched[0]
  }

  async _enrichWithCategoryInfo(programs) {
    if (!programs || programs.length === 0) return []
    
    const catSnap = await db.collection(COLLECTIONS.CATEGORY).get()
    const catMap = {}
    catSnap.forEach(doc => catMap[doc.id] = doc.data())

    return programs.map(p => {
      if (p.categoryId && catMap[p.categoryId]) {
        const cat = catMap[p.categoryId]
        p.categoryName = cat.name
        if (!p.profileURL) p.profileURL = cat.profileURL
      }
      return p
    })
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
        validated.name !== undefined ||
        validated.description !== undefined ||
        validated.basePrice !== undefined ||
        validated.profileURL !== undefined
      ) {
        const newData = { ...doc.data(), ...validated }
        const snapshot = profileHelper.getProgramSnapshot(id, newData)
        const classService = require('./classService')
        const enrollmentService = require('./enrollmentService')
        const trialService = require('./trialService')

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

    await ref.update({
      isDeleted: true,
      status: 'deleted',
      updatedAt: new Date().toISOString(),
    })
    return { message: 'Program deleted successfully (Soft delete)' }
  }

  async syncProgramsWithCategory(categoryId, categoryName) {
    const programsSnap = await db
      .collection(COLLECTIONS.PROGRAM)
      .where('categoryId', '==', categoryId)
      .get()

    if (!programsSnap.empty) {
      const firestoreHelper = require('../utils/firestoreHelper')
      const profileHelper = require('../utils/profileHelper')

      const writes = programsSnap.docs.map((pDoc) => {
        const programData = { ...pDoc.data(), category: categoryName }
        const updatedSnapshot = profileHelper.getProgramSnapshot(pDoc.id, programData)
        return {
          ref: pDoc.ref,
          data: {
            category: categoryName,
            updatedAt: new Date().toISOString(),
          },
        }
      })
      await firestoreHelper.chunkedUpdate(writes)
    }
  }
}

module.exports = new ProgramService()

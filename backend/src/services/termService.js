const { db, COLLECTIONS } = require('../config/database')
const { validateTerm, validateUpdateTerm } = require('../validators/termValidator')

class TermService {
  async createTerm(termData) {
    const validatedData = validateTerm(termData)
    const { name, branchIds } = validatedData
    
    // Check if term with same name exists for any of the branches (or global if empty)
    const existingSnap = await db.collection(COLLECTIONS.TERM).where('name', '==', name).get()
    
    if (!existingSnap.empty) {
      existingSnap.forEach(doc => {
        const existing = doc.data()
        const existingBranches = existing.branchIds || (existing.branchId ? [existing.branchId] : [])
        
        // If both are global (empty)
        if (branchIds.length === 0 && existingBranches.length === 0) {
          throw new Error(`A global term named "${name}" already exists.`)
        }
        
        // If there's an overlap in branch IDs
        const overlap = branchIds.find(id => existingBranches.includes(id))
        if (overlap) {
          throw new Error(`Term "${name}" already exists for one of the selected branches.`)
        }
      })
    }

    const docRef = await db.collection(COLLECTIONS.TERM).add(validatedData)
    return { id: docRef.id, ...validatedData }
  }

  async getAllTerms(filters = {}) {
    let query = db.collection(COLLECTIONS.TERM)
    if (filters.branchId) {
      // Fetch all terms and filter manually for array inclusion
      const snapshot = await query.get()
      const results = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        if (data.isDeleted === true) return
        const branchIds = data.branchIds || (data.branchId ? [data.branchId] : [])
        // Include if global OR if it matches the requested branch
        if (branchIds.length === 0 || branchIds.includes(filters.branchId)) {
          results.push({ id: doc.id, ...data })
        }
      })
      return results
    }

    const snapshot = await query.get()
    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((t) => t.isDeleted !== true)
  }

  async getTerm(id) {
    if (!id) throw new Error('Term ID is required')
    const doc = await db.collection(COLLECTIONS.TERM).doc(id).get()
    if (!doc.exists) throw new Error('Term not found')
    return { id: doc.id, ...doc.data() }
  }

  async updateTerm(id, data) {
    if (!id) throw new Error('Term ID is required')
    const validatedData = validateUpdateTerm(data)
    const termRef = db.collection(COLLECTIONS.TERM).doc(id)
    const termDoc = await termRef.get()

    if (!termDoc.exists) throw new Error('Term not found')

    await termRef.update(validatedData)

    const snapshot = await this.getTerm(id)
    const profileHelper = require('../utils/profileHelper')
    const termSnapshot = profileHelper.getTermSnapshot(id, snapshot)

    const classesSnap = await db
      .collection(COLLECTIONS.CLASS)
      .where('termId', '==', id)
      .get()

    if (!classesSnap.empty) {
      const batch = db.batch()
      classesSnap.forEach((cDoc) => {
        batch.update(cDoc.ref, {
          term: termSnapshot,
          updatedAt: new Date().toISOString()
        })
      })
      await batch.commit()
    }

    return { id, ...validatedData }
  }

  async deleteTerm(id) {
    if (!id) throw new Error('Term ID is required for deletion')
    const termRef = db.collection(COLLECTIONS.TERM).doc(id)
    const termDoc = await termRef.get()
    if (!termDoc.exists) throw new Error('Term not found')

    await termRef.update({
      isDeleted: true,
      status: 'deleted',
      updatedAt: new Date().toISOString(),
    })

    return { message: 'Term deleted successfully (Soft delete)' }
  }
}

module.exports = new TermService()

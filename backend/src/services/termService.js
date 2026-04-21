const { db, COLLECTIONS } = require('../config/database')
const { validateTerm, validateUpdateTerm } = require('../validators/termValidator')

class TermService {
  async createTerm(termData) {
    const validatedData = validateTerm(termData)
    const { name } = validatedData

    const snapshot = await db.collection(COLLECTIONS.TERM).get()
    const exists = snapshot.docs.some(
      (doc) => doc.data().name.toLowerCase() === name.toLowerCase(),
    )

    if (exists) {
      throw new Error(`Term "${name}" already exists`)
    }

    const docRef = await db.collection(COLLECTIONS.TERM).add(validatedData)
    return { id: docRef.id, ...validatedData }
  }

  async getAllTerms() {
    const snapshot = await db.collection(COLLECTIONS.TERM).get()
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
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

    const batch = db.batch()
    batch.delete(termRef)

    const classesSnap = await db
      .collection(COLLECTIONS.CLASS)
      .where('termId', '==', id)
      .get()

    classesSnap.forEach((doc) => {
      batch.update(doc.ref, {
        termId: null,
        term: null,
        updatedAt: new Date().toISOString(),
      })
    })

    await batch.commit()
    return { message: 'Term deleted successfully' }
  }
}

module.exports = new TermService()

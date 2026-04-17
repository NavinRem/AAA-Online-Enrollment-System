const { db, COLLECTIONS } = require('../config/database')
const { validateTerm } = require('../validators/academicValidator')

class TermService {
  async getAllTerms() {
    const snapshot = await db.collection(COLLECTIONS.TERM).get()
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  }

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


  async deleteTerm(id) {
    await db.collection(COLLECTIONS.TERM).doc(id).delete()
    return { message: 'Term deleted successfully' }
  }
}

module.exports = new TermService()

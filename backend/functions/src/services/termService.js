const { db, COLLECTIONS } = require('../config/database')

class TermService {
  async getAllTerms() {
    const snapshot = await db.collection(COLLECTIONS.TERM).get()
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  }

  async createTerm(termData) {
    const { name, startDate, endDate } = termData
    if (!name) throw new Error('Term name is required')
    if (!startDate || !endDate)
      throw new Error('Start date and end date are required for terms')

    const forbiddenKeywords = ['category', 'level', 'program', 'course']
    const lowerName = name.toLowerCase()
    const foundKeyword = forbiddenKeywords.find((keyword) =>
      lowerName.includes(keyword),
    )

    if (foundKeyword) {
      throw new Error(
        `Term name cannot contain the word "${foundKeyword}" to prevent inconsistency.`,
      )
    }

    const snapshot = await db.collection(COLLECTIONS.TERM).get()
    const exists = snapshot.docs.some(
      (doc) => doc.data().name.toLowerCase() === name.trim().toLowerCase(),
    )

    if (exists) {
      throw new Error(`Term "${name}" already exists`)
    }

    const data = {
      name: name.trim(),
      startDate,
      endDate,
      createdAt: new Date().toISOString(),
    }

    const docRef = await db.collection(COLLECTIONS.TERM).add(data)
    return { id: docRef.id, ...data }
  }

  async deleteTerm(id) {
    await db.collection(COLLECTIONS.TERM).doc(id).delete()
    return { message: 'Term deleted successfully' }
  }
}

module.exports = new TermService()

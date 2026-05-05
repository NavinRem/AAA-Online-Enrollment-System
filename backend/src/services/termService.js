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
    
    // 1. Fetch basic terms
    const snapshot = await query.get()
    let terms = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((t) => t.isDeleted !== true)

    // 2. Filter by branch if requested
    if (filters.branchId) {
      terms = terms.filter(t => {
        const branchIds = t.branchIds || (t.branchId ? [t.branchId] : [])
        return branchIds.length === 0 || branchIds.includes(filters.branchId)
      })
    }

    // 3. Map enrollments to terms
    const [classesSnap, enrollSnap] = await Promise.all([
      db.collection(COLLECTIONS.CLASS).get(),
      db.collection(COLLECTIONS.ENROLLMENT).where('isDeleted', '!=', true).get()
    ])

    const classToTermMap = {}
    classesSnap.forEach(doc => {
      const data = doc.data()
      if (data.termId) classToTermMap[doc.id] = data.termId
    })

    const termToStudentsMap = {}
    const termToRevenueMap = {}
    
    enrollSnap.forEach(doc => {
      const e = doc.data()
      const termId = classToTermMap[e.classId]
      if (termId) {
        if (!termToStudentsMap[termId]) termToStudentsMap[termId] = new Set()
        termToStudentsMap[termId].add(e.studentId)
        
        if (e.paymentStatus === 'paid') {
          termToRevenueMap[termId] = (termToRevenueMap[termId] || 0) + (Number(e.amount) || 0)
        }
      }
    })

    // 4. Calculate stats chronologically to identify first-time students
    const chronTerms = [...terms].sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    const globalSeenStudents = new Set()
    const termStatsMap = {}

    chronTerms.forEach(t => {
      const studentsInTerm = termToStudentsMap[t.id] || new Set()
      let newCount = 0
      studentsInTerm.forEach(sid => {
        if (!globalSeenStudents.has(sid)) {
          newCount++
        }
      })
      
      termStatsMap[t.id] = {
        totalStudents: studentsInTerm.size,
        newStudents: newCount,
        revenue: termToRevenueMap[t.id] || 0
      }
      
      // Update global seen list AFTER calculating for this term
      studentsInTerm.forEach(sid => globalSeenStudents.add(sid))
    })

    // 5. Return enriched terms
    return terms.map(t => ({
      ...t,
      ...termStatsMap[t.id]
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
      const classService = require('./classService')
      const enrollmentService = require('./enrollmentService')

      for (const cDoc of classesSnap.docs) {
        batch.update(cDoc.ref, {
          term: termSnapshot,
          updatedAt: new Date().toISOString()
        })
        
        // Trigger enrollment sync for each class in this term
        const classData = { ...cDoc.data(), term: termSnapshot }
        const classSnapshot = profileHelper.getClassSnapshot(cDoc.id, classData)
        await enrollmentService.syncEnrollmentsWithClass(cDoc.id, classSnapshot)
      }
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

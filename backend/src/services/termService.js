const { db, COLLECTIONS } = require('../config/database')
const { validateTerm, validateUpdateTerm } = require('../validators/termValidator')
const profileHelper = require('../utils/profileHelper')

class TermService {
  async createTerm(termData) {
    const validatedData = validateTerm(termData)
    const { name, branchIds, duplicateFromTermId, branchSettings } = validatedData

    await this.ensureUniqueTermName(name, branchIds)

    const offerings = duplicateFromTermId
      ? await this.duplicateOfferings(duplicateFromTermId)
      : await this.buildOfferingsForBranches(branchIds, branchSettings)

    const cleanTerm = {
      ...validatedData,
      offerings,
    }
    delete cleanTerm.duplicateFromTermId

    const docRef = await db.collection(COLLECTIONS.TERM).add(cleanTerm)
    return { id: docRef.id, ...cleanTerm }
  }

  async getAllTerms(filters = {}) {
    let terms = (await db.collection(COLLECTIONS.TERM).get()).docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((t) => t.isDeleted !== true)

    if (filters.branchId) {
      terms = terms.filter((t) => {
        const termBranchIds = t.branchIds || (t.branchId ? [t.branchId] : [])
        return termBranchIds.length === 0 || termBranchIds.includes(filters.branchId)
      })
    }

    const chronTerms = [...terms].sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate) : new Date(0)
      const dateB = b.startDate ? new Date(b.startDate) : new Date(0)
      return dateA - dateB
    })
    const globalSeenStudents = new Set()
    const termStatsMap = {}

    chronTerms.forEach((term) => {
      const studentIds = new Set()
      ;(term.offerings || []).forEach((offering) => {
        ;(offering.students || []).forEach((student) => {
          if (student.id || student.studentId) studentIds.add(student.id || student.studentId)
        })
      })

      let newCount = 0
      studentIds.forEach((studentId) => {
        if (!globalSeenStudents.has(studentId)) newCount++
      })

      termStatsMap[term.id] = {
        totalStudents: studentIds.size,
        newStudents: newCount,
        revenue: 0,
      }

      studentIds.forEach((studentId) => globalSeenStudents.add(studentId))
    })

    return terms.map((term) => {
      const stats = termStatsMap[term.id] || { totalStudents: 0, revenue: 0 }
      return {
        ...term,
        totalStudents: stats.totalStudents,
        revenue: stats.revenue,
      }
    })
  }

  async getTerm(id) {
    if (!id) throw new Error('Term ID is required')
    const doc = await db.collection(COLLECTIONS.TERM).doc(id).get()
    if (!doc.exists || doc.data().isDeleted) throw new Error('Term not found')
    return { id: doc.id, ...doc.data() }
  }

  async updateTerm(id, data) {
    if (!id) throw new Error('Term ID is required')
    const validatedData = validateUpdateTerm(data)
    const termRef = db.collection(COLLECTIONS.TERM).doc(id)
    const termDoc = await termRef.get()

    if (!termDoc.exists || termDoc.data().isDeleted) throw new Error('Term not found')

    const existingTerm = termDoc.data()
    const oldBranchIds = existingTerm.branchIds || (existingTerm.branchId ? [existingTerm.branchId] : [])
    const newBranchIds = validatedData.branchIds || []

    // 1. Handle Branch Expansion: If branches were added, add offerings for them
    const addedBranchIds = newBranchIds.filter(bid => !oldBranchIds.includes(bid))
    if (addedBranchIds.length > 0) {
      console.log(`Adding offerings for new branches: ${addedBranchIds.join(', ')}`)
      const newOfferings = await this.buildOfferingsForBranches(addedBranchIds, validatedData.branchSettings)
      validatedData.offerings = [...(existingTerm.offerings || []), ...newOfferings]
    }

    // 2. Handle Branch Removal: If branches were removed, clean up offerings
    const removedBranchIds = oldBranchIds.filter(bid => !newBranchIds.includes(bid))
    if (removedBranchIds.length > 0) {
      console.log(`Removing offerings for branches: ${removedBranchIds.join(', ')}`)
      validatedData.offerings = (validatedData.offerings || existingTerm.offerings || [])
        .filter(off => !removedBranchIds.includes(off.branchId))
    }

    await termRef.update(validatedData)

    const snapshot = await this.getTerm(id)
    await this.syncEnrollmentsForTerm(id, snapshot)

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

  async ensureUniqueTermName(name, branchIds) {
    const existingSnap = await db.collection(COLLECTIONS.TERM).where('name', '==', name).get()

    if (!existingSnap.empty) {
      existingSnap.forEach((doc) => {
        const existing = doc.data()
        if (existing.isDeleted) return
        const existingBranches = existing.branchIds || (existing.branchId ? [existing.branchId] : [])

        if (branchIds.length === 0 && existingBranches.length === 0) {
          throw new Error(`A global term named "${name}" already exists.`)
        }

        const overlap = branchIds.find((branchId) => existingBranches.includes(branchId))
        if (overlap) {
          throw new Error(`Term "${name}" already exists for one of the selected branches.`)
        }
      })
    }
  }

  async duplicateOfferings(sourceTermId) {
    const sourceDoc = await db.collection(COLLECTIONS.TERM).doc(sourceTermId).get()
    if (!sourceDoc.exists || sourceDoc.data().isDeleted) throw new Error('Source term not found')

    return (sourceDoc.data().offerings || []).map((offering) => ({
      ...offering,
      offeringId: db.collection(COLLECTIONS.TERM).doc().id,
      sourceOfferingId: offering.offeringId || '',
      students: (offering.students || []).map((student) => ({
        ...student,
        copiedAt: new Date().toISOString(),
      })),
    }))
  }

  async buildOfferingsForBranches(branchIds, branchSettings = []) {
    const [classesSnap, branchesSnap] = await Promise.all([
      db.collection(COLLECTIONS.CLASS).get(),
      db.collection(COLLECTIONS.BRANCH).get(),
    ])

    const branches = branchesSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((branch) => branch.isDeleted !== true)
      .filter((branch) => branchIds.length === 0 || branchIds.includes(branch.id))

    const offerings = []
    classesSnap.docs.forEach((classDoc) => {
      const classData = classDoc.data()
      if (classData.isDeleted) return

      const schedules = classData.schedules || []
      branches.forEach((branch) => {
        schedules.forEach((schedule) => {
          offerings.push({
            offeringId: db.collection(COLLECTIONS.TERM).doc().id,
            classId: classDoc.id,
            program: classData.program || null,
            branchId: branch.id,
            branch: profileHelper.getBranchSnapshot(branch.id, branch),
            scheduleId: schedule.id,
            schedule,
            students: [],
            currentCount: 0,
            status: 'active',
          })
        })
      })
    })

    return offerings
  }

  getTermSnapshot(termId, termData, offering = null) {
    let startDate = termData.startDate
    let endDate = termData.endDate

    if (offering && offering.branchId && termData.branchSettings) {
      const setting = termData.branchSettings.find(s => s.branchId === offering.branchId)
      if (setting) {
        startDate = setting.startDate
        endDate = setting.endDate
      }
    }

    return {
      id: termId,
      name: termData.name,
      startDate: startDate || '',
      endDate: endDate || '',
      totalSessions: termData.totalSessions || 0,
      offeringId: offering?.offeringId || '',
    }
  }

  async syncOfferingStudent(termId, offeringId, enrollment, action = 'upsert') {
    if (!termId || !offeringId) return

    const termRef = db.collection(COLLECTIONS.TERM).doc(termId)
    await db.runTransaction(async (transaction) => {
      const termDoc = await transaction.get(termRef)
      if (!termDoc.exists) throw new Error('Term not found')

      const termData = termDoc.data()
      const offerings = [...(termData.offerings || [])]
      const index = offerings.findIndex((offering) => offering.offeringId === offeringId)
      if (index === -1) throw new Error('Term offering not found')

      const offering = { ...offerings[index] }
      let students = [...(offering.students || [])]
      const studentId = enrollment.studentId

      if (action === 'remove') {
        students = students.filter((student) => (student.id || student.studentId) !== studentId)
      } else {
        const snapshot = {
          id: studentId,
          studentId,
          name: enrollment.student?.name || 'Unknown',
          profileURL: enrollment.student?.profileURL || '',
          status: enrollment.status || 'active',
          paymentStatus: enrollment.paymentStatus || 'unpaid',
          enrollmentId: enrollment.id || '',
          enrolledAt: enrollment.createdAt || enrollment.enrollmentDate || new Date().toISOString(),
        }
        const studentIndex = students.findIndex((student) => (student.id || student.studentId) === studentId)
        if (studentIndex >= 0) students[studentIndex] = { ...students[studentIndex], ...snapshot }
        else students.push(snapshot)
      }

      offerings[index] = {
        ...offering,
        students,
        currentCount: students.length,
      }

      transaction.update(termRef, {
        offerings,
        updatedAt: new Date().toISOString(),
      })
    })
  }

  async getOffering(termId, offeringId) {
    const term = await this.getTerm(termId)
    const offering = (term.offerings || []).find((item) => item.offeringId === offeringId)
    if (!offering) throw new Error('Term offering not found')
    return { term, offering }
  }

  async syncEnrollmentsForTerm(termId, termData) {
    const enrollSnap = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where('termId', '==', termId)
      .get()

    if (enrollSnap.empty) return

    const writes = []
    enrollSnap.forEach((doc) => {
      const enrollment = doc.data()
      const offering = (termData.offerings || []).find((item) => item.offeringId === enrollment.termOfferingId)
      if (!offering) return

      writes.push({
        ref: doc.ref,
        data: {
          term: this.getTermSnapshot(termId, termData, offering),
          class: profileHelper.getClassSnapshot(enrollment.classId, {
            program: offering.program,
            branch: offering.branch,
            schedule: offering.schedule,
            term: this.getTermSnapshot(termId, termData, offering),
            status: offering.status || 'active',
          }),
          updatedAt: new Date().toISOString(),
        },
      })
    })

    if (writes.length > 0) {
      const firestoreHelper = require('../utils/firestoreHelper')
      await firestoreHelper.chunkedUpdate(writes)
    }
  }
}

module.exports = new TermService()

const { db, COLLECTIONS } = require('../config/database')
const {
  validateTerm,
  validateUpdateTerm,
} = require('../validators/termValidator')
const profileHelper = require('../utils/profileHelper')

class TermService {
  async createTerm(termData) {
    const validatedData = validateTerm(termData)
    const { name, branchIds, duplicateFromTermId, branchSettings } =
      validatedData

    await this.ensureUniqueTermName(name, branchIds)

    const offerings = duplicateFromTermId
      ? await this.duplicateOfferings(duplicateFromTermId, branchIds)
      : await this.buildOfferingsForBranches(branchIds, branchSettings)

    const cleanTerm = {
      ...validatedData,
      offerings,
    }
    delete cleanTerm.duplicateFromTermId

    const docRef = await db.collection(COLLECTIONS.TERM).add(cleanTerm)
    return { id: docRef.id, ...cleanTerm }
  }

  /**
   * Updates a specific offering within a term.
   * @param {string} termId
   * @param {string} offeringId
   * @param {Object} updateData - { capacity, status, etc. }
   */
  async updateTermOffering(termId, offeringId, updateData) {
    if (!termId || !offeringId)
      throw new Error('Term ID and Offering ID are required')

    const termRef = db.collection(COLLECTIONS.TERM).doc(termId)
    const termDoc = await termRef.get()
    if (!termDoc.exists) throw new Error('Term not found')

    const termData = termDoc.data()
    const offerings = termData.offerings || []
    const offIdx = offerings.findIndex(
      (o) => String(o.offeringId) === String(offeringId),
    )

    if (offIdx === -1) throw new Error('Offering not found in this term')

    // Apply updates to the specific offering
    offerings[offIdx] = {
      ...offerings[offIdx],
      ...updateData,
      updatedAt: new Date().toISOString(),
    }

    await termRef.update({ offerings })
    return offerings[offIdx]
  }

  async getAllTerms(filters = {}) {
    let terms = (await db.collection(COLLECTIONS.TERM).get()).docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((t) => t.isDeleted !== true)

    if (filters.branchId) {
      terms = terms.filter((t) => {
        const termBranchIds = t.branchIds || (t.branchId ? [t.branchId] : [])
        return (
          termBranchIds.length === 0 || termBranchIds.includes(filters.branchId)
        )
      })
    }

    const chronTerms = [...terms].sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate) : new Date(0)
      const dateB = b.startDate ? new Date(b.startDate) : new Date(0)
      return dateA - dateB
    })
    const globalSeenStudents = new Set()
    const termStatsMap = {}

    // Fetch paid enrollments to aggregate term revenue
    const enrollmentsSnap = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where('paymentStatus', 'in', ['paid', 'confirmed', 'success'])
      .get()
    const enrollments = enrollmentsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    const revenueMap = {}
    enrollments.forEach((e) => {
      const isCancelledOrDeleted =
        ['cancelled', 'deleted', 'failed'].includes(
          String(e.status || '').toLowerCase(),
        ) || e.isDeleted === true
      if (e.termId && !isCancelledOrDeleted) {
        revenueMap[e.termId] =
          (revenueMap[e.termId] || 0) + (Number(e.amount) || 0)
      }
    })

    chronTerms.forEach((term) => {
      const studentIds = new Set()
      const offeringsArray = Array.isArray(term.offerings)
        ? term.offerings
        : term.offerings && typeof term.offerings === 'object'
          ? Object.values(term.offerings)
          : []

      offeringsArray.forEach((offering) => {
        ;(offering.students || []).forEach((student) => {
          if (student.id || student.studentId)
            studentIds.add(student.id || student.studentId)
        })
      })

      let newCount = 0
      studentIds.forEach((studentId) => {
        if (!globalSeenStudents.has(studentId)) newCount++
      })

      termStatsMap[term.id] = {
        totalStudents: studentIds.size,
        newStudents: newCount,
        revenue: revenueMap[term.id] || 0,
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

    const termData = { id: doc.id, ...doc.data() }

    // Enrich offerings with student data from enrollments
    if (termData.offerings && termData.offerings.length > 0) {
      const enrollmentsSnap = await db
        .collection('enrollments')
        .where('termId', '==', id)
        .where('status', 'in', [
          'active',
          'confirmed',
          'trial',
          'paid',
          'unpaid',
          'success',
        ])
        .get()

      const enrollments = enrollmentsSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }))

      termData.offerings = termData.offerings.map((off) => {
        const offEnrollments = enrollments.filter((e) => {
          // Strict matching: If termOfferingId is provided, it MUST match
          if (e.termOfferingId) {
            return String(e.termOfferingId) === String(off.offeringId)
          }

          // Fallback matching: If no termOfferingId, match by class and branch
          const matchesBase =
            String(e.classId) === String(off.classId) &&
            String(e.branchId) === String(off.branchId)
          if (!matchesBase) return false

          // Heuristic: Assign unassigned students to the FIRST offering of that class in that branch
          // to avoid double counting across multiple schedules.
          const firstOfferingOfClass = termData.offerings.find(
            (o) =>
              String(o.classId) === String(off.classId) &&
              String(o.branchId) === String(off.branchId),
          )
          return firstOfferingOfClass?.offeringId === off.offeringId
        })

        return {
          ...off,
          currentCount: offEnrollments.length,
          studentIds: offEnrollments.map((e) => e.studentId),
        }
      })
    }

    return termData
  }

  async updateTerm(id, data) {
    if (!id) throw new Error('Term ID is required')
    const validatedData = validateUpdateTerm(data)
    const termRef = db.collection(COLLECTIONS.TERM).doc(id)
    const termDoc = await termRef.get()

    if (!termDoc.exists || termDoc.data().isDeleted)
      throw new Error('Term not found')

    const existingTerm = termDoc.data()
    const oldBranchIds =
      existingTerm.branchIds ||
      (existingTerm.branchId ? [existingTerm.branchId] : [])
    const newBranchIds =
      validatedData.branchIds !== undefined
        ? validatedData.branchIds
        : oldBranchIds

    if (validatedData.newOfferingsRequest) {
      const { branchIds, classIds, scheduleIds } = validatedData.newOfferingsRequest
      const newOfferings = await this.buildOfferingsForClasses(
        branchIds,
        classIds,
        scheduleIds
      )
      validatedData.offerings = [
        ...(validatedData.offerings || existingTerm.offerings || []),
        ...newOfferings,
      ]
      delete validatedData.newOfferingsRequest
    }

    if (validatedData.deleteOfferingsRequest) {
      const { branchId, programId } = validatedData.deleteOfferingsRequest
      validatedData.offerings = (
        validatedData.offerings ||
        existingTerm.offerings ||
        []
      ).filter(
        (off) =>
          !(
            String(off.branchId) === String(branchId) &&
            (String(off.classId) === String(programId) ||
              String(off.program?.id) === String(programId))
          ),
      )
      delete validatedData.deleteOfferingsRequest
    }

    // 1. Handle Branch Expansion: If branches were added, add offerings for them
    const addedBranchIds = newBranchIds.filter(
      (bid) => !oldBranchIds.some((oid) => String(oid) === String(bid)),
    )
    if (addedBranchIds.length > 0) {
      console.log(
        `Adding offerings for new branches: ${addedBranchIds.join(', ')}`,
      )
      const newOfferings = await this.buildOfferingsForBranches(
        addedBranchIds,
        validatedData.branchSettings,
      )
      validatedData.offerings = [
        ...(validatedData.offerings || existingTerm.offerings || []),
        ...newOfferings,
      ]
    }

    // 2. Handle Branch Removal: If branches were removed, clean up offerings
    const removedBranchIds = oldBranchIds.filter(
      (bid) => !newBranchIds.includes(bid),
    )
    if (removedBranchIds.length > 0) {
      console.log(
        `Removing offerings for branches: ${removedBranchIds.join(', ')}`,
      )
      validatedData.offerings = (
        validatedData.offerings ||
        existingTerm.offerings ||
        []
      ).filter(
        (off) =>
          !removedBranchIds.some(
            (rbid) => String(rbid) === String(off.branchId),
          ),
      )
    } else {
      validatedData.offerings =
        validatedData.offerings || existingTerm.offerings || []
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
    const existingSnap = await db
      .collection(COLLECTIONS.TERM)
      .where('name', '==', name)
      .get()

    if (!existingSnap.empty) {
      existingSnap.forEach((doc) => {
        const existing = doc.data()
        if (existing.isDeleted) return
        const existingBranches =
          existing.branchIds || (existing.branchId ? [existing.branchId] : [])

        if (branchIds.length === 0 && existingBranches.length === 0) {
          throw new Error(`A global term named "${name}" already exists.`)
        }

        const overlap = branchIds.find((branchId) =>
          existingBranches.some((ebid) => String(ebid) === String(branchId)),
        )
        if (overlap) {
          throw new Error(
            `Term "${name}" already exists for one of the selected branches.`,
          )
        }
      })
    }
  }

  async duplicateOfferings(sourceTermId, targetBranchIds = []) {
    const sourceDoc = await db
      .collection(COLLECTIONS.TERM)
      .doc(sourceTermId)
      .get()
    if (!sourceDoc.exists || sourceDoc.data().isDeleted)
      throw new Error('Source term not found')

    let offerings = sourceDoc.data().offerings || []

    // If the new term has a specific branch scope, only duplicate offerings for those branches
    if (targetBranchIds.length > 0) {
      offerings = offerings.filter((off) =>
        targetBranchIds.some((tbid) => String(tbid) === String(off.branchId)),
      )
    }

    return offerings.map((offering) => ({
      ...offering,
      offeringId: db.collection(COLLECTIONS.TERM).doc().id,
      sourceOfferingId: offering.offeringId || '',
      students: (offering.students || []).map((student) => ({
        ...student,
        copiedAt: new Date().toISOString(),
      })),
    }))
  }

  async buildOfferingsForBranches(branchIds) {
    const [classesSnap, branchesSnap] = await Promise.all([
      db.collection(COLLECTIONS.CLASS).get(),
      db.collection(COLLECTIONS.BRANCH).get(),
    ])

    const branches = branchesSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((branch) => branch.isDeleted !== true)
      .filter(
        (branch) =>
          branchIds.length === 0 ||
          branchIds.some((bid) => String(bid) === String(branch.id)),
      )

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

  async buildOfferingsForClasses(branchIds, classIds, scheduleIds = []) {
    const ids = Array.isArray(branchIds) ? branchIds : [branchIds]
    if (ids.length === 0) throw new Error('Branch IDs are required')
    if (!classIds || classIds.length === 0)
      throw new Error('Class IDs are required')

    const branchesPromise = db.collection(COLLECTIONS.BRANCH).get()
    const classPromises = classIds.map((cid) =>
      db.collection(COLLECTIONS.CLASS).doc(cid).get()
    )

    const [branchesSnap, ...classDocs] = await Promise.all([
      branchesPromise,
      ...classPromises,
    ])

    const classesSnapDocs = classDocs.filter(
      (doc) => doc.exists && !doc.data().isDeleted
    )

    const validBranches = branchesSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter(
        (b) => !b.isDeleted && ids.some((bid) => String(bid) === String(b.id)),
      )

    if (validBranches.length === 0) throw new Error('No valid branches found')

    const offerings = []

    classesSnapDocs.forEach((classDoc) => {
      const classData = classDoc.data()
      let schedules = classData.schedules || []

      // Filter schedules if scheduleIds are explicitly provided
      if (scheduleIds && scheduleIds.length > 0) {
        schedules = schedules.filter(s => scheduleIds.includes(s.id))
      }

      validBranches.forEach((branch) => {
        const branchSnapshot = profileHelper.getBranchSnapshot(
          branch.id,
          branch,
        )
        schedules.forEach((schedule) => {
          offerings.push({
            offeringId: db.collection(COLLECTIONS.TERM).doc().id,
            classId: classDoc.id,
            program: classData.program || null,
            branchId: branch.id,
            branch: branchSnapshot,
            scheduleId: schedule.id,
            schedule: {
              id: schedule.id,
              day: schedule.day,
              time: schedule.time,
            },
            capacity: classData.program?.capacity || 20,
            currentCount: 0,
            students: [],
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
      const setting = termData.branchSettings.find(
        (s) => s.branchId === offering.branchId,
      )
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
      const offerings = Array.isArray(termData.offerings)
        ? [...termData.offerings]
        : termData.offerings && typeof termData.offerings === 'object'
          ? Object.values(termData.offerings)
          : []
      const index = offerings.findIndex(
        (offering) => offering.offeringId === offeringId,
      )
      if (index === -1) throw new Error('Term offering not found')

      const offering = { ...offerings[index] }
      let students = [...(offering.students || [])]
      const studentId = enrollment.studentId

      if (action === 'remove') {
        students = students.filter(
          (student) => (student.id || student.studentId) !== studentId,
        )
      } else {
        const snapshot = {
          id: studentId,
          studentId,
          name: enrollment.student?.name || 'Unknown',
          profileURL: enrollment.student?.profileURL || '',
          status: enrollment.status || 'active',
          paymentStatus: enrollment.paymentStatus || 'unpaid',
          enrollmentId: enrollment.id || '',
          enrolledAt:
            enrollment.createdAt ||
            enrollment.enrollmentDate ||
            new Date().toISOString(),
        }
        const studentIndex = students.findIndex(
          (student) => (student.id || student.studentId) === studentId,
        )
        if (studentIndex >= 0)
          students[studentIndex] = { ...students[studentIndex], ...snapshot }
        else students.push(snapshot)
      }

      const capacity = offering.schedule?.capacity || offering.capacity || 20
      const newStatus = students.length >= capacity ? 'full' : 'active'

      offerings[index] = {
        ...offering,
        students,
        currentCount: students.length,
        status: newStatus,
      }

      transaction.update(termRef, {
        offerings,
        updatedAt: new Date().toISOString(),
      })
    })
  }

  async getOffering(termId, offeringId) {
    const term = await this.getTerm(termId)
    const offeringsArray = Array.isArray(term.offerings)
      ? term.offerings
      : term.offerings && typeof term.offerings === 'object'
        ? Object.values(term.offerings)
        : []
    const offering = offeringsArray.find(
      (item) => item.offeringId === offeringId,
    )
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
      const offeringsArray = Array.isArray(termData.offerings)
        ? termData.offerings
        : termData.offerings && typeof termData.offerings === 'object'
          ? Object.values(termData.offerings)
          : []
      const offering = offeringsArray.find(
        (item) => item.offeringId === enrollment.termOfferingId,
      )
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

const { db, COLLECTIONS } = require('../config/database')
const profileHelper = require('../utils/profileHelper')
const {
  validateClass,
  validateUpdateClass,
} = require('../validators/classValidator')

class ClassService {
  async createClass(classData) {
    const validated = validateClass(classData)
    const { branchIds, schedules, schedule, ...baseData } = validated
    
    // Support both single schedule (legacy/edit) and multiple schedules (batch add)
    const activeSchedules = schedules && schedules.length > 0 ? schedules : [schedule]

    const [programDoc, termDoc] = await Promise.all([
      db.collection(COLLECTIONS.PROGRAM).doc(validated.programId).get(),
      db.collection(COLLECTIONS.TERM).doc(validated.termId).get(),
    ])

    if (!programDoc.exists) throw new Error('Program not found')
    if (!termDoc.exists) throw new Error('Term not found')

    const termData = termDoc.data()
    const programData = programDoc.data()

    // Fetch category info to ensure complete program snapshot
    if (programData.categoryId) {
      const catDoc = await db
        .collection(COLLECTIONS.CATEGORY)
        .doc(programData.categoryId)
        .get()
      if (catDoc.exists) {
        const catData = catDoc.data()
        programData.category = catData.name
        if (!programData.profileURL) {
          programData.profileURL = catData.profileURL
        }
      }
    }

    const teacherDocs = await Promise.all(
      validated.teacherIds.map((id) =>
        db.collection(COLLECTIONS.TEACHER).doc(id).get(),
      ),
    )
    if (teacherDocs.some((d) => !d.exists))
      throw new Error('One or more teachers not found')

    const createdClasses = []
    const batch = db.batch()

    for (const bId of branchIds) {
      const branchDoc = await db.collection(COLLECTIONS.BRANCH).doc(bId).get()
      if (!branchDoc.exists) continue

      const branchSnapshot = profileHelper.getBranchSnapshot(bId, branchDoc.data())

      for (const sched of activeSchedules) {
        // Uniqueness check: Program + Term + Branch + Schedule
        const duplicateQuery = db
          .collection(COLLECTIONS.CLASS)
          .where('termId', '==', validated.termId)
          .where('branchId', '==', bId)
          .where('programId', '==', validated.programId)
          .where('isDeleted', '==', false)
          .get()

        const dupSnap = await duplicateQuery
        const isDuplicate = dupSnap.docs.some((doc) => {
          const d = doc.data()
          return (d.schedule?.day === sched.day && d.schedule?.time === sched.time) ||
                 (d.schedules?.some(s => s.day === sched.day && s.time === sched.time))
        })

        if (isDuplicate) {
          console.warn(`[ClassService] Skipping duplicate: ${programData.name} at ${branchSnapshot.name} on ${sched.day} ${sched.time}`)
          continue
        }

        const id = db.collection(COLLECTIONS.CLASS).doc().id
        const newClass = {
          ...baseData,
          branchId: bId,
          schedule: sched,
          schedules: [sched], // Maintain both for compatibility
          currentCount: 0,
          program: profileHelper.getProgramSnapshot(validated.programId, programData),
          teachers: teacherDocs.map((d) => profileHelper.getTeacherSnapshot(d.id, d.data())),
          branch: branchSnapshot,
          term: profileHelper.getTermSnapshot(validated.termId, termData),
          status: this.calculateStatus(
            termData.startDate,
            termData.endDate,
            0,
            validated.capacity || 0,
          ),
          isDeleted: false,
          createdAt: new Date().toISOString(),
        }

        batch.set(db.collection(COLLECTIONS.CLASS).doc(id), newClass)
        createdClasses.push({ id, ...newClass })
      }
    }

    if (createdClasses.length === 0) {
      throw new Error('No new classes were created. They might already exist.')
    }

    await batch.commit()

    return createdClasses.length === 1
      ? createdClasses[0]
      : {
          message: `Successfully created ${createdClasses.length} class instances`,
          count: createdClasses.length,
          classes: createdClasses,
        }
  }

  async duplicateSpecificClasses(classIds, targetTermId) {
    if (!classIds || classIds.length === 0) throw new Error('No classes selected')
    
    const targetTermDoc = await db.collection(COLLECTIONS.TERM).doc(targetTermId).get()
    if (!targetTermDoc.exists) throw new Error('Target term not found')
    const targetTermSnapshot = profileHelper.getTermSnapshot(targetTermId, targetTermDoc.data())

    const sourceClassesSnap = await Promise.all(
      classIds.map(id => db.collection(COLLECTIONS.CLASS).doc(id).get())
    )

    // Fetch existing classes in target term to avoid duplicates
    const existingTargetClassesSnap = await db.collection(COLLECTIONS.CLASS)
      .where('termId', '==', targetTermId)
      .get()
    
    const existingKeys = new Set(
      existingTargetClassesSnap.docs.map((doc) => {
        const d = doc.data()
        const s = d.schedule || (d.schedules && d.schedules.length > 0 ? d.schedules[0] : null)
        const branchKey = d.branchIds ? d.branchIds.sort().join(',') : (d.branchId || '')
        return `${d.programId}-${branchKey}-${s?.day}-${s?.time}`
      })
    )

    const batch = db.batch()
    let count = 0

    sourceClassesSnap.forEach(doc => {
      if (!doc.exists) return
      const data = doc.data()
      if (data.isDeleted) return

      const s = data.schedule || (data.schedules && data.schedules.length > 0 ? data.schedules[0] : null)
      const branchKey = data.branchIds ? data.branchIds.sort().join(',') : (data.branchId || '')
      const key = `${data.programId}-${branchKey}-${s?.day}-${s?.time}`

      if (existingKeys.has(key)) return // Skip duplicates

      const newId = db.collection(COLLECTIONS.CLASS).doc().id
      const duplicatedClass = {
        ...data,
        termId: targetTermId,
        term: targetTermSnapshot,
        currentCount: 0,
        studentIds: [], // Clear students from source class
        students: [],    // Clear student snapshots
        status: this.calculateStatus(
          targetTermSnapshot.startDate,
          targetTermSnapshot.endDate,
          0,
          data.capacity || 0
        ),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      batch.set(db.collection(COLLECTIONS.CLASS).doc(newId), duplicatedClass)
      count++
    })

    if (count > 0) await batch.commit()
    return { message: `Successfully duplicated ${count} classes to ${targetTermSnapshot.name}`, count }
  }

  async getAllClasses(filters = {}) {
    let query = db.collection(COLLECTIONS.CLASS)
    if (filters.programId)
      query = query.where('programId', '==', filters.programId)
    if (filters.branchId)
      query = query.where('branchId', '==', filters.branchId)
    if (filters.termId) query = query.where('termId', '==', filters.termId)
    if (filters.status) query = query.where('status', '==', filters.status)

    const snapshot = await query.get()
    const results = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

    // Enrich with category info for frontend rendering (not saved to DB)
    const enrichedResults = await this._enrichWithCategoryInfo(results)

    // Fallback for legacy records that don't have isDeleted field
    return enrichedResults.filter((c) => c.isDeleted !== true)
  }

  async getClass(id) {
    const doc = await db.collection(COLLECTIONS.CLASS).doc(id).get()
    if (!doc.exists) throw new Error('Class not found')
    const classData = { id: doc.id, ...doc.data() }
    const enriched = await this._enrichWithCategoryInfo([classData])
    return enriched[0]
  }

  async updateClass(id, updateData) {
    const validated = validateUpdateClass(updateData)
    const ref = db.collection(COLLECTIONS.CLASS).doc(id)

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(ref)
      if (!doc.exists) throw new Error('Class not found')

      const currentData = doc.data()

      // Archived Check
      if (
        currentData.term?.endDate &&
        new Date(currentData.term.endDate) < new Date()
      ) {
        throw new Error('Cannot modify a class in an archived term.')
      }

      // Hard check for active enrollments if capacity is being reduced below current count
      if (
        validated.capacity !== undefined &&
        validated.capacity > 0 &&
        validated.capacity < currentData.currentCount
      ) {
        throw new Error(
          `Cannot set capacity to ${validated.capacity} as there are already ${currentData.currentCount} active enrollments.`,
        )
      }

      const termData = validated.term || currentData.term
      const calculatedStatus = this.calculateStatus(
        termData.startDate,
        termData.endDate,
        currentData.currentCount || 0,
        validated.capacity !== undefined ? validated.capacity : (currentData.capacity || 0),
      )

      const updates = {
        ...validated,
        status: calculatedStatus,
        updatedAt: new Date().toISOString(),
      }

      // Re-fetch snapshots if IDs changed to ensure "real valid names"
      if (validated.programId && validated.programId !== currentData.programId) {
        const pDoc = await transaction.get(db.collection(COLLECTIONS.PROGRAM).doc(validated.programId))
        if (pDoc.exists) {
          updates.program = profileHelper.getProgramSnapshot(validated.programId, pDoc.data())
        }
      }

      if (validated.termId && validated.termId !== currentData.termId) {
        const tDoc = await transaction.get(db.collection(COLLECTIONS.TERM).doc(validated.termId))
        if (tDoc.exists) {
          updates.term = profileHelper.getTermSnapshot(validated.termId, tDoc.data())
        }
      }

      if (validated.branchId && validated.branchId !== currentData.branchId) {
        const bDoc = await transaction.get(db.collection(COLLECTIONS.BRANCH).doc(validated.branchId))
        if (bDoc.exists) {
          updates.branch = profileHelper.getBranchSnapshot(validated.branchId, bDoc.data())
        }
      }

      transaction.update(ref, updates)

      const syncNeeded = validated.schedule || validated.capacity !== undefined
      if (syncNeeded) {
        const newData = { ...currentData, ...validated }
        const snapshot = profileHelper.getClassSnapshot(id, newData)
        await require('./enrollmentService').syncEnrollmentsWithClass(
          id,
          snapshot,
        )
      }
    })

    return { id, message: 'Class updated successfully' }
  }

  async deleteClass(id) {
    const ref = db.collection(COLLECTIONS.CLASS).doc(id)
    const doc = await ref.get()
    if (!doc.exists) throw new Error('Class not found')

    if (doc.data().currentCount > 0) {
      throw new Error(
        'Cannot delete class with active enrollments (Current Count > 0)',
      )
    }

    // Check for ANY enrollment history (including cancelled or completed)
    const historySnap = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where('classId', '==', id)
      .limit(1)
      .get()

    if (historySnap.empty) {
      // Truly empty class with no history -> Hard Delete
      await ref.delete()
      return { message: 'Class deleted permanently (No history found)' }
    } else {
      // Class has historical links -> Soft Delete to preserve data integrity
      await ref.update({
        isDeleted: true,
        updatedAt: new Date().toISOString(),
      })
      return { message: 'Class soft-deleted (History preserved)' }
    }
  }

  // --- Operational Utilities ---

  async duplicateClassesFromTerm(sourceTermId, targetTermId, branchId = null) {
    let query = db
      .collection(COLLECTIONS.CLASS)
      .where('termId', '==', sourceTermId)
    if (branchId) query = query.where('branchId', '==', branchId)

    const snapshot = await query.get()
    if (snapshot.empty) throw new Error('No classes found in source term')

    const targetTermDoc = await db
      .collection(COLLECTIONS.TERM)
      .doc(targetTermId)
      .get()
    if (!targetTermDoc.exists) throw new Error('Target term not found')

    const targetTermSnapshot = profileHelper.getTermSnapshot(
      targetTermId,
      targetTermDoc.data(),
    )

    // Fetch existing classes in target term to avoid duplicates
    const existingTargetClassesSnap = await db
      .collection(COLLECTIONS.CLASS)
      .where('termId', '==', targetTermId)
      .get()
    const existingKeys = new Set(
      existingTargetClassesSnap.docs.map((doc) => {
        const d = doc.data()
        const s = d.schedules?.[0]
        return `${d.programId}-${d.branchId}-${s?.day}-${s?.time}`
      }),
    )

    const batch = db.batch()
    let count = 0

    snapshot.docs.forEach((doc) => {
      const data = doc.data()
      if (data.isDeleted) return // Skip deleted classes

      const s = data.schedule || (data.schedules && data.schedules.length > 0 ? data.schedules[0] : null)
      const key = `${data.programId}-${data.branchId}-${s?.day}-${s?.time}`

      if (existingKeys.has(key)) return // Skip duplicates

      const newId = db.collection(COLLECTIONS.CLASS).doc().id
      const duplicatedClass = {
        ...data,
        termId: targetTermId,
        term: targetTermSnapshot,
        currentCount: 0,
        studentIds: [], // Ensure new classes start empty
        students: [],
        createdAt: new Date().toISOString(),
      }
      delete duplicatedClass.updatedAt
      batch.set(db.collection(COLLECTIONS.CLASS).doc(newId), duplicatedClass)
      count++
    })

    await batch.commit()
    return { message: `Successfully duplicated ${count} classes`, count }
  }

  async syncStudentCount(classId) {
    const enrollmentsSnap = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where('classId', '==', classId)
      .get()

    const SEAT_TAKING_STATUSES = ['active', 'confirmed', 'paid', 'unpaid', 'success']
    
    const activeEnrollments = enrollmentsSnap.docs
      .map(doc => doc.data())
      .filter(e => !e.isDeleted && SEAT_TAKING_STATUSES.includes(String(e.status || '').toLowerCase()))

    const studentIds = activeEnrollments.map(e => e.studentId)
    const students = activeEnrollments.map(e => ({
      id: e.studentId,
      name: e.student?.name || 'Unknown',
      profileURL: e.student?.profileURL || null,
      enrolledAt: e.createdAt || e.enrollmentDate
    }))

    const count = activeEnrollments.length

    await db
      .collection(COLLECTIONS.CLASS)
      .doc(classId)
      .update({ 
        currentCount: count,
        studentIds,
        students,
        updatedAt: new Date().toISOString()
      })
      
    return { classId, count }
  }

  async syncAllClassCounts() {
    const classesSnap = await db.collection(COLLECTIONS.CLASS).get()
    let updated = 0

    for (const cDoc of classesSnap.docs) {
      await this.syncStudentCount(cDoc.id)
      updated++
    }
    return { message: `Synchronized ${updated} classes` }
  }

  async validateCapacity(classId) {
    const classDoc = await db.collection(COLLECTIONS.CLASS).doc(classId).get()
    if (!classDoc.exists) throw new Error('Class not found')

    const { currentCount, capacity } = classDoc.data()
    return {
      isAvailable: currentCount < capacity,
      remaining: Math.max(0, capacity - currentCount),
    }
  }

  async syncClassesWithProgram(programId, programSnapshot) {
    const snapshot = await db
      .collection(COLLECTIONS.CLASS)
      .where('programId', '==', programId)
      .get()
    if (snapshot.empty) return

    const firestoreHelper = require('../utils/firestoreHelper')
    const writes = snapshot.docs.map((doc) => ({
      ref: doc.ref,
      data: {
        program: programSnapshot,
        updatedAt: new Date().toISOString(),
      },
    }))
    await firestoreHelper.chunkedUpdate(writes)

    const enrollmentService = require('./enrollmentService')
    for (const doc of snapshot.docs) {
      const classData = { ...doc.data(), program: programSnapshot }
      const classSnapshot = profileHelper.getClassSnapshot(doc.id, classData)
      await enrollmentService.syncEnrollmentsWithClass(doc.id, classSnapshot)
    }
  }

  calculateStatus(startDate, endDate, currentCount = 0, capacity = 0) {
    if (!startDate || !endDate) return 'active'

    const dateHelper = require('../utils/dateHelper')
    const todayStr = dateHelper.getTodayString()

    // 1. Archived (Term over)
    if (todayStr > endDate) return 'archived'

    // 2. Full (Capacity reached, not archived)
    if (capacity > 0 && currentCount >= capacity) return 'full'

    // 3. Upcoming (Term not started)
    if (todayStr < startDate) return 'upcoming'

    // 4. Active (Current term, has space)
    return 'active'
  }

  async _enrichWithCategoryInfo(classList) {
    if (!classList || classList.length === 0) return []

    const categoryIds = [
      ...new Set(
        classList.map((c) => c.program?.categoryId).filter((id) => !!id),
      ),
    ]

    if (categoryIds.length === 0) return classList

    const categoriesSnap = await db.collection(COLLECTIONS.CATEGORY).get()
    const categoriesMap = {}
    categoriesSnap.forEach((doc) => {
      categoriesMap[doc.id] = doc.data()
    })

    return classList.map((cls) => {
      if (cls.program && cls.program.categoryId) {
        const cat = categoriesMap[cls.program.categoryId]
        if (cat) {
          // Add category object for frontend rendering (item.program.category.profileURL)
          cls.program.category = {
            name: cat.name,
            profileURL: cat.profileURL,
          }
          // Fallback program profileURL if missing
          if (!cls.program.profileURL) {
            cls.program.profileURL = cat.profileURL
          }
        }
      }
      return cls
    })
  }
}

module.exports = new ClassService()

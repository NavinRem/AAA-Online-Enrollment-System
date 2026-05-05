const { db, COLLECTIONS } = require('../config/database')
const profileHelper = require('../utils/profileHelper')
const firestoreHelper = require('../utils/firestoreHelper')
const {
  validateTrial,
  validateUpdateTrial,
} = require('../validators/trialValidator')

class TrialService {
  async createTrial(trialData) {
    const validated = validateTrial(trialData)
    const { studentId, programId, classId, branchId, isGuest } = validated

    // 1. Fetch Basic Context (Program, Branch, Class)
    const [programDoc, classDoc, branchDoc] = await Promise.all([
      db.collection(COLLECTIONS.PROGRAM).doc(programId).get(),
      classId
        ? db.collection(COLLECTIONS.CLASS).doc(classId).get()
        : Promise.resolve({ exists: false }),
      branchId
        ? db.collection(COLLECTIONS.BRANCH).doc(branchId).get()
        : Promise.resolve({ exists: false }),
    ])

    if (!programDoc.exists) throw new Error('Program not found')

    const programSnapshot = profileHelper.getProgramSnapshot(
      programId,
      programDoc.data(),
    )
    let classSnapshot = null
    let branchSnapshot = null

    if (classDoc.exists) {
      classSnapshot = profileHelper.getClassSnapshot(classId, classDoc.data())
      branchSnapshot = classDoc.data().branch
    } else if (branchDoc.exists) {
      branchSnapshot = profileHelper.getBranchSnapshot(
        branchId,
        branchDoc.data(),
      )
    }

    // 2. Handle Identity (Parent & Student)
    let finalStudentId
    let finalParentId
    let studentSnapshot
    let parentSnapshot = null

    if (isGuest) {
      // Auto-create accounts if guest
      const accounts = await this._ensureGuestAccounts(validated)
      finalStudentId = accounts.studentId
      finalParentId = accounts.parentId

      const [sDoc, pDoc] = await Promise.all([
        db.collection(COLLECTIONS.STUDENT).doc(finalStudentId).get(),
        db.collection(COLLECTIONS.PARENT).doc(finalParentId).get(),
      ])

      studentSnapshot = profileHelper.getStudentSnapshot(
        finalStudentId,
        sDoc.data(),
      )
      parentSnapshot = profileHelper.getParentSnapshot(
        finalParentId,
        pDoc.data(),
      )
    } else {
      // Use incoming studentId to fetch record
      const studentDoc = await db
        .collection(COLLECTIONS.STUDENT)
        .doc(studentId)
        .get()
      if (!studentDoc.exists) throw new Error('Student not found')

      const sData = studentDoc.data()
      finalStudentId = studentId
      finalParentId = sData.parentId

      studentSnapshot = profileHelper.getStudentSnapshot(finalStudentId, sData)

      if (finalParentId) {
        const parentDoc = await db
          .collection(COLLECTIONS.PARENT)
          .doc(finalParentId)
          .get()
        if (parentDoc.exists) {
          parentSnapshot = profileHelper.getParentSnapshot(
            finalParentId,
            parentDoc.data(),
          )
        }
      }
    }

    // 3. Persist Trial Record
    const trialId = db.collection(COLLECTIONS.TRIAL).doc().id
    const newTrial = {
      ...validated,
      studentId: finalStudentId,
      parentId: finalParentId,
      student: studentSnapshot,
      parent: parentSnapshot,
      program: programSnapshot,
      class: classSnapshot,
      branch: branchSnapshot,
      // Keep isGuest: true for records created via guest flow to allow tracking
      isGuest: !!validated.isGuest,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await db.collection(COLLECTIONS.TRIAL).doc(trialId).set(newTrial)
    return { id: trialId, ...newTrial }
  }

  async getAllTrials(filters = {}) {
    let query = db.collection(COLLECTIONS.TRIAL)
    if (filters.studentId)
      query = query.where('studentId', '==', filters.studentId)
    if (filters.classId) query = query.where('classId', '==', filters.classId)
    if (filters.status) query = query.where('status', '==', filters.status)

    // Date-range filtering for "Trial Today" optimization
    if (filters.trialDateFrom) {
      query = query.where('trialDate', '>=', filters.trialDateFrom)
    }
    if (filters.trialDateTo) {
      query = query.where('trialDate', '<', filters.trialDateTo)
    }

    const snapshot = await query.get()
    return snapshot.docs
      .map((doc) => profileHelper.ensureFreshAge({ id: doc.id, ...doc.data() }))
      .filter((t) => t.isDeleted !== true)
  }

  async getTrial(id) {
    const doc = await db.collection(COLLECTIONS.TRIAL).doc(id).get()
    if (!doc.exists) throw new Error('Trial not found')
    const data = profileHelper.ensureFreshAge({ id: doc.id, ...doc.data() })
    if (data.isDeleted) throw new Error('Trial has been deleted')
    return data
  }

  async updateTrial(id, updateData) {
    const validated = validateUpdateTrial(updateData)
    const trialRef = db.collection(COLLECTIONS.TRIAL).doc(id)

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(trialRef)
      if (!doc.exists) throw new Error('Trial not found')

      const currentData = doc.data()
      transaction.update(trialRef, {
        ...validated,
        updatedAt: new Date().toISOString(),
      })

      // Handle snapshots if class or program changes
      if (validated.classId && validated.classId !== currentData.classId) {
        const classDoc = await db
          .collection(COLLECTIONS.CLASS)
          .doc(validated.classId)
          .get()
        if (classDoc.exists) {
          const classSnap = profileHelper.getClassSnapshot(
            validated.classId,
            classDoc.data(),
          )
          const branchSnap = classDoc.data().branch
          transaction.update(trialRef, { class: classSnap, branch: branchSnap })
        }
      } else if (
        validated.branchId &&
        validated.branchId !== currentData.branchId &&
        !validated.classId
      ) {
        const branchDoc = await db
          .collection(COLLECTIONS.BRANCH)
          .doc(validated.branchId)
          .get()
        if (branchDoc.exists) {
          const branchSnap = profileHelper.getBranchSnapshot(
            validated.branchId,
            branchDoc.data(),
          )
          transaction.update(trialRef, { branch: branchSnap, class: null })
        }
      }
    })

    return { id, message: 'Trial updated successfully' }
  }

  async deleteTrial(id) {
    const trialRef = db.collection(COLLECTIONS.TRIAL).doc(id)
    const doc = await trialRef.get()
    if (!doc.exists) throw new Error('Trial not found')

    await trialRef.update({
      isDeleted: true,
      status: 'deleted',
      updatedAt: new Date().toISOString(),
    })
    return { message: 'Trial deleted successfully (Soft delete)' }
  }

  /**
   * Internal method to ensure guest accounts exist.
   * Matches by phone or email for parents.
   */
  async _ensureGuestAccounts(trialData) {
    const {
      guestParentName,
      guestParentEmail,
      guestParentPhone,
      guestParentAvatar,
      guestStudentName,
      guestStudentDOB,
      guestStudentAvatar,
    } = trialData

    let parentId
    let studentId

    // 1. Find or Create Parent
    // Try phone first
    let parentQuery = db
      .collection(COLLECTIONS.PARENT)
      .where('phone', '==', guestParentPhone)
      .limit(1)
    let parentSnapshot = await parentQuery.get()

    // Try email if phone didn't work and email exists
    if (parentSnapshot.empty && guestParentEmail) {
      parentQuery = db
        .collection(COLLECTIONS.PARENT)
        .where('email', '==', guestParentEmail)
        .limit(1)
      parentSnapshot = await parentQuery.get()
    }

    if (!parentSnapshot.empty) {
      parentId = parentSnapshot.docs[0].id
    } else {
      // Create new parent with all standard fields
      const parentRef = db.collection(COLLECTIONS.PARENT).doc()
      parentId = parentRef.id
      await parentRef.set({
        name: guestParentName,
        email: guestParentEmail || '',
        phone: guestParentPhone,
        profileURL: guestParentAvatar || '',
        status: 'active',
        isDeleted: false,
        childrenInfo: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }

    // 2. Find or Create Student under this Parent
    const studentQuery = await db
      .collection(COLLECTIONS.STUDENT)
      .where('parentId', '==', parentId)
      .where('name', '==', guestStudentName)
      .limit(1)
      .get()

    if (!studentQuery.empty) {
      studentId = studentQuery.docs[0].id
    } else {
      // Create new student with all standard fields
      const studentRef = db.collection(COLLECTIONS.STUDENT).doc()
      studentId = studentRef.id

      const parentDoc = await db.collection(COLLECTIONS.PARENT).doc(parentId).get()
      const parentInfo = parentDoc.exists
        ? [profileHelper.getParentSnapshot(parentId, parentDoc.data())]
        : []

      await studentRef.set({
        parentId,
        name: guestStudentName,
        dob: guestStudentDOB || null,
        age: guestStudentDOB ? profileHelper.calculateAge(guestStudentDOB) : 0,
        profileURL: guestStudentAvatar || '',
        status: 'inactive',
        isDeleted: false,
        parentInfo,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      // Update parent's childrenInfo
      const studentSnapshot = profileHelper.getStudentSnapshot(studentId, {
        name: guestStudentName,
        dob: guestStudentDOB || null,
        profileURL: guestStudentAvatar || '',
        status: 'inactive',
      })
      const existingChildren = parentDoc.exists ? (parentDoc.data().childrenInfo || []) : []
      await db.collection(COLLECTIONS.PARENT).doc(parentId).update({
        childrenInfo: [...existingChildren, studentSnapshot],
      })
    }

    return { parentId, studentId }
  }

  // --- Synchronization Utilities ---
  async syncTrialsWithClass(classId, classSnapshot) {
    const snapshot = await db
      .collection(COLLECTIONS.TRIAL)
      .where('classId', '==', classId)
      .get()
    if (snapshot.empty) return
    const writes = snapshot.docs.map((doc) => ({
      ref: doc.ref,
      data: { class: classSnapshot },
    }))
    await firestoreHelper.chunkedUpdate(writes)
  }

  async syncTrialsWithProgram(programId, programSnapshot) {
    const snapshot = await db
      .collection(COLLECTIONS.TRIAL)
      .where('programId', '==', programId)
      .get()
    if (snapshot.empty) return
    const writes = snapshot.docs.map((doc) => ({
      ref: doc.ref,
      data: { program: programSnapshot },
    }))
    await firestoreHelper.chunkedUpdate(writes)
  }

  async syncTrialsWithStudent(studentId, studentSnapshot) {
    const snapshot = await db
      .collection(COLLECTIONS.TRIAL)
      .where('studentId', '==', studentId)
      .get()
    if (snapshot.empty) return
    const writes = snapshot.docs.map((doc) => ({
      ref: doc.ref,
      data: { student: studentSnapshot },
    }))
    await firestoreHelper.chunkedUpdate(writes)
  }

  async syncTrialsWithParent(parentId, parentSnapshot) {
    const snapshot = await db
      .collection(COLLECTIONS.TRIAL)
      .where('parentId', '==', parentId)
      .get()
    if (snapshot.empty) return
    const writes = snapshot.docs.map((doc) => ({
      ref: doc.ref,
      data: { parent: parentSnapshot },
    }))
    await firestoreHelper.chunkedUpdate(writes)
  }
}

module.exports = new TrialService()

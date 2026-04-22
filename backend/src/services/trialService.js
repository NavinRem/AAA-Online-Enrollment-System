const { db, COLLECTIONS } = require('../config/database')
const profileHelper = require('../utils/profileHelper')
const {
  validateTrial,
  validateUpdateTrial,
} = require('../validators/trialValidator')

class TrialService {
  async createTrial(trialData) {
    const validatedData = validateTrial(trialData)
    const { studentId, programId, classId, parentId, isGuest } = validatedData

    let trialId
    await db.runTransaction(async (transaction) => {
      const programRef = db.collection(COLLECTIONS.PROGRAM).doc(programId)
      const classRef = db.collection(COLLECTIONS.CLASS).doc(classId)

      const [programDoc, classDoc] = await Promise.all([
        transaction.get(programRef),
        transaction.get(classRef),
      ])

      if (!programDoc.exists) throw new Error('Program not found')
      if (!classDoc.exists) throw new Error('Class not found')

      const classData = classDoc.data()
      const programData = programDoc.data()

      const trialRef = db.collection(COLLECTIONS.TRIAL).doc()
      trialId = trialRef.id

      const data = {
        ...validatedData,
        program: profileHelper.getProgramSnapshot(programId, programData),
        class: profileHelper.getClassSnapshot(classId, classData),
        branchId: classData.branchId,
      }

      if (isGuest) {
        data.parent = {
          name: validatedData.guestParentName,
          phoneNumber: validatedData.guestPhone,
          isGuest: true,
        }
        data.student = {
          name: validatedData.guestStudentName,
          age: validatedData.guestStudentAge,
          isGuest: true,
        }
      } else {
        const studentDoc = await transaction.get(
          db.collection(COLLECTIONS.STUDENT).doc(studentId),
        )
        if (!studentDoc.exists) throw new Error('Student not found')

        const effectiveParentId = parentId || studentDoc.data().parentId
        const parentDoc = await transaction.get(
          db.collection(COLLECTIONS.PARENT).doc(effectiveParentId),
        )
        if (!parentDoc.exists) throw new Error('Parent not found')

        data.student = profileHelper.getStudentSnapshot(
          studentId,
          studentDoc.data(),
        )
        data.parent = profileHelper.getParentSnapshot(
          effectiveParentId,
          parentDoc.data(),
        )
        data.parentId = effectiveParentId
      }

      transaction.set(trialRef, data)
    })

    return {
      id: trialId,
      message: isGuest
        ? 'Guest trial recorded'
        : 'Trial booking created successfully',
    }
  }

  async getAllTrials(filters = {}) {
    let query = db.collection(COLLECTIONS.TRIAL)

    if (filters.studentId)
      query = query.where('studentId', '==', filters.studentId)
    if (filters.programId)
      query = query.where('programId', '==', filters.programId)
    if (filters.classId) query = query.where('classId', '==', filters.classId)
    if (filters.branchId)
      query = query.where('branchId', '==', filters.branchId)
    if (filters.status) query = query.where('status', '==', filters.status)
    if (filters.isGuest !== undefined)
      query = query.where('isGuest', '==', filters.isGuest === 'true')

    const snapshot = await query.orderBy('createdAt', 'desc').get()
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  }

  async getTrial(id) {
    if (!id) throw new Error('Trial ID is required')
    const doc = await db.collection(COLLECTIONS.TRIAL).doc(id).get()
    if (!doc.exists) throw new Error('Trial record not found')
    return { id: doc.id, ...doc.data() }
  }

  async updateTrial(id, updateData) {
    if (!id) throw new Error('Trial ID is required')
    const validatedUpdate = validateUpdateTrial(updateData)
    const trialRef = db.collection(COLLECTIONS.TRIAL).doc(id)

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(trialRef)
      if (!doc.exists) throw new Error('Trial record not found')

      const oldData = doc.data()

      if (
        validatedUpdate.programId &&
        validatedUpdate.programId !== oldData.programId
      ) {
        const pDoc = await transaction.get(
          db.collection(COLLECTIONS.PROGRAM).doc(validatedUpdate.programId),
        )
        if (pDoc.exists)
          validatedUpdate.program = profileHelper.getProgramSnapshot(
            pDoc.id,
            pDoc.data(),
          )
      }
      if (
        validatedUpdate.classId &&
        validatedUpdate.classId !== oldData.classId
      ) {
        const cDoc = await transaction.get(
          db.collection(COLLECTIONS.CLASS).doc(validatedUpdate.classId),
        )
        if (cDoc.exists) {
          const cData = cDoc.data()
          validatedUpdate.class = profileHelper.getClassSnapshot(cDoc.id, cData)
          validatedUpdate.branchId = cData.branchId
        }
      }

      if (!oldData.isGuest) {
        if (
          validatedUpdate.studentId &&
          validatedUpdate.studentId !== oldData.studentId
        ) {
          const sDoc = await transaction.get(
            db.collection(COLLECTIONS.STUDENT).doc(validatedUpdate.studentId),
          )
          if (sDoc.exists)
            validatedUpdate.student = profileHelper.getStudentSnapshot(
              sDoc.id,
              sDoc.data(),
            )
        }
        if (
          validatedUpdate.parentId &&
          validatedUpdate.parentId !== oldData.parentId
        ) {
          const pDoc = await transaction.get(
            db.collection(COLLECTIONS.PARENT).doc(validatedUpdate.parentId),
          )
          if (pDoc.exists)
            validatedUpdate.parent = profileHelper.getParentSnapshot(
              pDoc.id,
              pDoc.data(),
            )
        }
      }

      transaction.update(trialRef, validatedUpdate)
    })

    return { id, ...validatedUpdate }
  }

  async deleteTrial(id) {
    if (!id) throw new Error('Trial ID is required')
    await db.collection(COLLECTIONS.TRIAL).doc(id).delete()
    return { message: 'Trial record deleted successfully' }
  }
}

module.exports = new TrialService()

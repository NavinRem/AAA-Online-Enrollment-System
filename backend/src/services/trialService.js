const { db, COLLECTIONS } = require('../config/database')
const authService = require('./authService')
const programService = require('./programService')
const profileHelper = require('../utils/profileHelper')
const { validateTrial } = require('../validators/trialValidator')

class TrialService {
  async createTrial(trialData) {
    const validatedData = validateTrial(trialData)
    const { studentId, programId, classId, parentId } = validatedData

    let trialId
    await db.runTransaction(async (transaction) => {
      const classRef = db.collection(COLLECTIONS.CLASS).doc(classId)
      const studentRef = db.collection(COLLECTIONS.STUDENT).doc(studentId)
      const programRef = db.collection(COLLECTIONS.PROGRAM).doc(programId)

      const [classDoc, studentDoc, programDoc] = await Promise.all([
        transaction.get(classRef),
        transaction.get(studentRef),
        transaction.get(programRef),
      ])

      if (!classDoc.exists) throw new Error('Class instance not found')
      if (!studentDoc.exists) throw new Error('Student not found')
      if (!programDoc.exists) throw new Error('Program model not found')

      const classData = classDoc.data()
      const studentData = studentDoc.data()
      const programData = programDoc.data()
      const effectiveParentId = parentId || studentData.parentId

      if (!effectiveParentId) throw new Error('Student has no parent linked')
      const parentData = await authService.getUser(effectiveParentId)
      if (!parentData) throw new Error('Parent not found')

      const trialRef = db.collection(COLLECTIONS.TRIAL).doc()
      trialId = trialRef.id

      const data = {
        ...validatedData,
        parentId: effectiveParentId,
        parent: profileHelper.getUserSnapshot(effectiveParentId, parentData),
        student: profileHelper.getStudentSnapshot(studentId, studentData),
        program: profileHelper.getProgramSnapshot(programId, programData),
        class: profileHelper.getClassSnapshot(classId, classData),

        branchId: classData.branchId || null,
        branch: classData.branch || null,
      }

      transaction.set(trialRef, data)
    })

    return { id: trialId, message: 'Trial class booked successfully' }
  }


  async getAllTrials() {
    const snapshot = await db
      .collection(COLLECTIONS.TRIAL)
      .orderBy('createdAt', 'desc')
      .get()
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  }

  async getTrial(id) {
    const doc = await db.collection(COLLECTIONS.TRIAL).doc(id).get()
    if (!doc.exists) throw new Error('Trial not found')
    return { id: doc.id, ...doc.data() }
  }

  async updateTrial(id, updateData) {
    const validatedUpdate = validateUpdateTrial(updateData)
    const trialRef = db.collection(COLLECTIONS.TRIAL).doc(id)
    const doc = await trialRef.get()
    if (!doc.exists) throw new Error('Trial not found')

    await trialRef.update(validatedUpdate)
    return { id, ...validatedUpdate }
  }


  async deleteTrial(id) {
    const trialRef = db.collection(COLLECTIONS.TRIAL).doc(id)
    const doc = await trialRef.get()
    if (!doc.exists) throw new Error('Trial not found')
    await trialRef.delete()
    return { message: 'Trial record deleted' }
  }
}

module.exports = new TrialService()

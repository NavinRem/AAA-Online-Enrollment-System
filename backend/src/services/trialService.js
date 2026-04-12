const { db, COLLECTIONS } = require('../config/database')
const userService = require('./userService')
const programService = require('./programService')
const profileHelper = require('../utils/profileHelper')

class TrialService {
  async createTrial(trialData) {
    const { studentId, programId, classId, trialDate } = trialData

    if (!studentId || !programId || !classId) {
      throw new Error('studentId, programId, and classId are required')
    }

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
      const parentId = studentData.parentId

      if (!parentId) throw new Error('Student has no parent linked')
      const parentData = await userService.getUser(parentId)
      if (!parentData) throw new Error('Parent not found')

      const trialRef = db.collection(COLLECTIONS.TRIAL).doc()
      trialId = trialRef.id

      const data = {
        studentId,
        classId,
        programId,
        parentId,
        trialDate: trialDate || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        status: 'booked', // booked, attended, cancelled, converted

        // Snapshots for easy display without extra joins
        parent: profileHelper.getUserSnapshot(parentId, parentData),
        student: profileHelper.getStudentSnapshot(studentId, studentData),
        program: profileHelper.getProgramSnapshot(programId, programData),
        class: profileHelper.getClassSnapshot(classId, classData),

        branchId: classData.branchId || null,
        branch: classData.branch || null,
        remark: trialData.remark || '',
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
    const trialRef = db.collection(COLLECTIONS.TRIAL).doc(id)
    const doc = await trialRef.get()
    if (!doc.exists) throw new Error('Trial not found')

    const safeData = { ...updateData, updatedAt: new Date().toISOString() }
    delete safeData.id

    await trialRef.update(safeData)
    return { id, ...safeData }
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

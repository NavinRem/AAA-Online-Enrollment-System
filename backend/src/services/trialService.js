const { db, COLLECTIONS } = require('../config/database')
const profileHelper = require('../utils/profileHelper')
const { validateTrial } = require('../validators/trialValidator')

class TrialService {
  async createTrial(trialData) {
    const validated = validateTrial(trialData)
    const { studentId, programId, classId, isGuest } = validated

    const [programDoc, classDoc] = await Promise.all([
      db.collection(COLLECTIONS.PROGRAM).doc(programId).get(),
      db.collection(COLLECTIONS.CLASS).doc(classId).get(),
    ])

    if (!programDoc.exists) throw new Error('Program not found')
    if (!classDoc.exists) throw new Error('Class not found')

    const programSnapshot = profileHelper.getProgramSnapshot(programId, programDoc.data())
    const classSnapshot = profileHelper.getClassSnapshot(classId, classDoc.data())
    const branchSnapshot = classDoc.data().branch

    let studentSnapshot = {}
    if (isGuest) {
      studentSnapshot = {
        id: 'guest',
        name: validated.guestStudentName,
        parentName: validated.guestParentName,
        phone: validated.guestPhone,
        isGuest: true,
      }
    } else {
      const studentDoc = await db.collection(COLLECTIONS.STUDENT).doc(studentId).get()
      if (!studentDoc.exists) throw new Error('Student not found')
      studentSnapshot = profileHelper.getStudentSnapshot(studentId, studentDoc.data())
    }

    const trialId = db.collection(COLLECTIONS.TRIAL).doc().id
    const newTrial = {
      ...validated,
      student: studentSnapshot,
      program: programSnapshot,
      class: classSnapshot,
      branch: branchSnapshot,
      createdAt: new Date().toISOString(),
    }

    await db.collection(COLLECTIONS.TRIAL).doc(trialId).set(newTrial)
    return { id: trialId, ...newTrial }
  }

  async getAllTrials(filters = {}) {
    let query = db.collection(COLLECTIONS.TRIAL)
    if (filters.studentId) query = query.where('studentId', '==', filters.studentId)
    if (filters.classId) query = query.where('classId', '==', filters.classId)
    if (filters.status) query = query.where('status', '==', filters.status)

    const snapshot = await query.get()
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  }

  async getTrial(id) {
    const doc = await db.collection(COLLECTIONS.TRIAL).doc(id).get()
    if (!doc.exists) throw new Error('Trial not found')
    return { id: doc.id, ...doc.data() }
  }

  async updateTrial(id, updateData) {
    const trialRef = db.collection(COLLECTIONS.TRIAL).doc(id)
    
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(trialRef)
      if (!doc.exists) throw new Error('Trial not found')

      const currentData = doc.data()
      transaction.update(trialRef, { ...updateData, updatedAt: new Date().toISOString() })

      if (updateData.classId && updateData.classId !== currentData.classId) {
        const classDoc = await db.collection(COLLECTIONS.CLASS).doc(updateData.classId).get()
        if (classDoc.exists) {
          const classSnap = profileHelper.getClassSnapshot(updateData.classId, classDoc.data())
          const branchSnap = classDoc.data().branch
          transaction.update(trialRef, { class: classSnap, branch: branchSnap })
        }
      }
    })

    return { id, message: 'Trial updated successfully' }
  }

  async deleteTrial(id) {
    const trialRef = db.collection(COLLECTIONS.TRIAL).doc(id)
    const doc = await trialRef.get()
    if (!doc.exists) throw new Error('Trial not found')

    await trialRef.delete()
    return { message: 'Trial deleted successfully' }
  }

  // --- Synchronization Utilities ---

  async syncTrialsWithClass(classId, classSnapshot) {
    const snapshot = await db
      .collection(COLLECTIONS.TRIAL)
      .where('classId', '==', classId)
      .get()

    if (snapshot.empty) return

    const batch = db.batch()
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { class: classSnapshot })
    })
    await batch.commit()
  }

  async syncTrialsWithProgram(programId, programSnapshot) {
    const snapshot = await db
      .collection(COLLECTIONS.TRIAL)
      .where('programId', '==', programId)
      .get()

    if (snapshot.empty) return

    const batch = db.batch()
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { program: programSnapshot })
    })
    await batch.commit()
  }
}

module.exports = new TrialService()

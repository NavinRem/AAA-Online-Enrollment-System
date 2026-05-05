const { db, COLLECTIONS } = require('../config/database')
const authService = require('./authService')
const profileHelper = require('../utils/profileHelper')
const firestoreHelper = require('../utils/firestoreHelper')
const {
  validateTeacher,
  validateUpdateTeacher,
} = require('../validators/teacherValidator')

class TeacherService {
  async createTeacher(teacherData) {
    const { name, email, status, profileURL, password, category } = teacherData
    const validatedProfile = validateTeacher({ name, email, status, profileURL, category })
    
    // Contact Uniqueness Check (Phone)
    if (teacherData.phone) {
      const phoneSnap = await db.collection(COLLECTIONS.TEACHER)
        .where('phone', '==', teacherData.phone)
        .get()
      const exists = phoneSnap.docs.some(d => d.data().isDeleted !== true)
      if (exists) {
        throw new Error(`A teacher with phone number "${teacherData.phone}" already exists.`)
      }
      validatedProfile.phone = teacherData.phone
    }
    const finalPassword = password || 'Temporary123'
    return authService.registerAccount(
      { ...validatedProfile, password: finalPassword },
      'teacher',
      COLLECTIONS.TEACHER,
    )
  }

  async getAllTeachers(filters = {}) {
    let query = db.collection(COLLECTIONS.TEACHER)

    if (filters.status) query = query.where('status', '==', filters.status)

    const snapshot = await query.get()
    return snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((t) => t.isDeleted !== true)
  }

  async getTeacher(id) {
    if (!id) throw new Error('Teacher ID is required')
    const doc = await db.collection(COLLECTIONS.TEACHER).doc(id).get()
    if (!doc.exists) throw new Error('Teacher not found')
    return { id: doc.id, ...doc.data() }
  }

  async updateTeacher(id, updateData) {
    if (!id) throw new Error('Teacher ID is required')
    const validatedData = validateUpdateTeacher(updateData)
    validatedData.updatedAt = new Date().toISOString()
    const teacherRef = db.collection(COLLECTIONS.TEACHER).doc(id)

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(teacherRef)
      if (!doc.exists) throw new Error('Teacher not found')

      transaction.update(teacherRef, validatedData)

      if (
        validatedData.name ||
        validatedData.profileURL !== undefined ||
        validatedData.email !== undefined ||
        validatedData.status !== undefined ||
        validatedData.category !== undefined
      ) {
        const newData = { ...doc.data(), ...validatedData }
        const snapshot = profileHelper.getTeacherSnapshot(id, newData)
        await this.syncClassesWithTeacher(id, snapshot)
      }
    })

    return { id, ...validatedData }
  }

  async deleteTeacher(id) {
    if (!id) throw new Error('Teacher ID is required')

    const teacherRef = db.collection(COLLECTIONS.TEACHER).doc(id)
    const teacherDoc = await teacherRef.get()
    if (!teacherDoc.exists) throw new Error('Teacher not found')

    await teacherRef.update({
      isDeleted: true,
      status: 'deleted',
      updatedAt: new Date().toISOString(),
    })

    return { message: 'Teacher deleted successfully (Soft delete)' }
  }

  async syncClassesWithTeacher(teacherId, teacherSnapshot) {
    const snapshot = await db
      .collection(COLLECTIONS.CLASS)
      .where('teacherIds', 'array-contains', teacherId)
      .get()

    if (snapshot.empty) return

    const writes = snapshot.docs.map((doc) => {
      const data = doc.data()
      const teachers = (data.teachers || []).map((t) =>
        t.id === teacherId ? teacherSnapshot : t,
      )
      return {
        ref: doc.ref,
        data: {
          teachers,
          updatedAt: new Date().toISOString(),
        },
      }
    })

    await firestoreHelper.chunkedUpdate(writes)
  }
}

module.exports = new TeacherService()

const { db, COLLECTIONS } = require('../config/database')
const authService = require('./authService')
const profileHelper = require('../utils/profileHelper')
const {
  validateTeacher,
  validateUpdateTeacher,
} = require('../validators/teacherValidator')

class TeacherService {
  async createTeacher(teacherData) {
    const { name, email, status, profileURL, password, category } = teacherData
    const validatedProfile = validateTeacher({ name, email, status, profileURL, category })
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
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
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

    const classesSnap = await db
      .collection(COLLECTIONS.CLASS)
      .where('teacherId', '==', id)
      .where('status', '==', 'open')
      .get()

    if (!classesSnap.empty) {
      throw new Error(
        'Cannot delete teacher assigned to active classes. Please reassign classes first.',
      )
    }

    await db.collection(COLLECTIONS.TEACHER).doc(id).delete()
    await authService.deleteAccount(id)
    return { message: 'Teacher deleted successfully' }
  }

  async syncClassesWithTeacher(teacherId, teacherSnapshot) {
    const snapshot = await db
      .collection(COLLECTIONS.CLASS)
      .where('teacherId', '==', teacherId)
      .get()

    if (snapshot.empty) return

    const batch = db.batch()
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        teacher: teacherSnapshot,
        updatedAt: new Date().toISOString(),
      })
    })
    await batch.commit()
  }
}

module.exports = new TeacherService()

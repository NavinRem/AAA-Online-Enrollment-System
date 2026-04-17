const { db, COLLECTIONS } = require('../config/database')
const authService = require('./authService')
const {
  validateTeacher,
  validateUpdateTeacher,
} = require('../validators/teacherValidator')

class TeacherService {
  async registerTeacher(teacherData) {
    return authService.registerAccount(
      teacherData,
      'teacher',
      COLLECTIONS.TEACHER,
    )
  }

  async getTeacher(id) {
    if (!id) throw new Error('Teacher ID is required')
    const doc = await db.collection(COLLECTIONS.TEACHER).doc(id).get()
    if (!doc.exists) throw new Error('Teacher not found')
    return { id: doc.id, ...doc.data() }
  }

  async getAllTeachers() {
    const snapshot = await db.collection(COLLECTIONS.TEACHER).get()
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  }

  async updateTeacher(id, updateData) {
    if (!id) throw new Error('Teacher ID is required for update')
    const validatedUpdate = validateUpdateTeacher(updateData)

    const ref = db.collection(COLLECTIONS.TEACHER).doc(id)
    const doc = await ref.get()
    if (!doc.exists) throw new Error('Teacher not found')

    await ref.update(validatedUpdate)
    return { id, ...validatedUpdate }
  }


  async deleteTeacher(id) {
    if (!id) throw new Error('Teacher ID is required for deletion')
    const ref = db.collection(COLLECTIONS.TEACHER).doc(id)
    const doc = await ref.get()

    if (doc.exists) {
      await ref.delete()
    }

    await authService.deleteAccount(id)
    return { id, message: 'Teacher deleted successfully' }
  }
}

module.exports = new TeacherService()

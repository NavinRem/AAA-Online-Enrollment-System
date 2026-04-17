const { db, COLLECTIONS } = require('../config/database')
const profileHelper = require('../utils/profileHelper')
const {
  validateStudent,
  validateUpdateStudent,
} = require('../validators/studentValidator')

class StudentService {
  async createStudent(studentData) {
    const validatedData = validateStudent(studentData)
    const { parentId } = validatedData

    const parentDoc = await db
      .collection(COLLECTIONS.PARENT)
      .doc(parentId)
      .get()
    if (!parentDoc.exists)
      throw new Error(`Parent not found with ID: ${parentId}`)

    const pData = parentDoc.data()
    const parentInfo = profileHelper.getUserSnapshot(parentId, pData)

    const studentId = db.collection(COLLECTIONS.STUDENT).doc().id
    const data = {
      ...validatedData,
      parentInfo,
    }

    const batch = db.batch()
    batch.set(db.collection(COLLECTIONS.STUDENT).doc(studentId), data)

    const snapshot = profileHelper.getStudentSnapshot(studentId, data)
    const studentInfo = pData.studentInfo || []
    studentInfo.push(snapshot)

    batch.update(db.collection(COLLECTIONS.PARENT).doc(parentId), {
      studentInfo,
    })

    await batch.commit()

    return { id: studentId, message: 'Student registered successfully' }
  }

  async getStudent(id) {
    const doc = await db.collection(COLLECTIONS.STUDENT).doc(id).get()
    if (!doc.exists) throw new Error('Student not found')
    return { id: doc.id, ...doc.data() }
  }

  async updateStudent(id, updateData) {
    const validatedUpdate = validateUpdateStudent(updateData)
    const studentRef = db.collection(COLLECTIONS.STUDENT).doc(id)
    const doc = await studentRef.get()
    if (!doc.exists) throw new Error('Student not found')

    const currentData = doc.data()
    const parentId = currentData.parentId

    const batch = db.batch()
    batch.update(studentRef, validatedUpdate)

    const syncFields = ['name', 'dob', 'medicalNote', 'profileURL']
    const shouldSync = Object.keys(validatedUpdate).some((key) =>
      syncFields.includes(key),
    )

    if (shouldSync) {
      const snapshot = profileHelper.getStudentSnapshot(id, {
        ...currentData,
        ...validatedUpdate,
      })
      await this._syncStudentMirrors(id, snapshot, parentId, batch)
    }

    await batch.commit()

    return { message: 'Student updated successfully' }
  }

  async getStudentsByParentID(parentId) {
    const snapshot = await db
      .collection(COLLECTIONS.STUDENT)
      .where('parentId', '==', parentId)
      .get()
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  }

  async getAllStudents() {
    const snapshot = await db.collection(COLLECTIONS.STUDENT).get()
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  }

  async _syncStudentMirrors(sid, snapshot, parentId, batch) {
    const parentRef = db.collection(COLLECTIONS.PARENT).doc(parentId)
    const parentDoc = await parentRef.get()

    if (parentDoc.exists) {
      let studentInfo = parentDoc.data().studentInfo || []
      const index = studentInfo.findIndex((s) => s.id === sid)
      if (index !== -1) {
        studentInfo[index] = snapshot
      } else {
        studentInfo.push(snapshot)
      }
      batch.update(parentRef, { studentInfo })
    }

    const enrollmentsSnap = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where('studentId', '==', sid)
      .get()
    enrollmentsSnap.forEach((eDoc) =>
      batch.update(eDoc.ref, { student: snapshot }),
    )
  }
}

module.exports = new StudentService()

const { db, COLLECTIONS } = require('../config/database')
const profileHelper = require('../utils/profileHelper')
const {
  validateStudent,
  validateUpdateStudent,
} = require('../validators/studentValidator')

class StudentService {
  async createStudent(studentData) {
    const validated = validateStudent(studentData)
    const { parentId } = validated

    const parentRef = db.collection(COLLECTIONS.PARENT).doc(parentId)
    const parentDoc = await parentRef.get()

    if (!parentDoc.exists) {
      throw new Error(`Parent not found with ID: ${parentId}`)
    }

    const pData = parentDoc.data()
    const parentInfo = profileHelper.getUserSnapshot(parentId, pData)

    const studentId = db.collection(COLLECTIONS.STUDENT).doc().id

    const dobDate = new Date(validated.dob)
    if (isNaN(dobDate)) {
      throw new Error('Invalid Date of Birth')
    }

    const cleanData = {
      parentId: validated.parentId,
      name: validated.name,
      dob: dobDate,
      age:
        validated.age ??
        (profileHelper.calculateAge ? profileHelper.calculateAge(dobDate) : 0),
      profileURL: validated.profileURL,
      status: validated.status,
      parentInfo,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const snapshot = profileHelper.getStudentSnapshot(studentId, cleanData)

    const studentInfo = [...(pData.studentInfo || []), snapshot]

    const batch = db.batch()

    batch.set(db.collection(COLLECTIONS.STUDENT).doc(studentId), cleanData)

    batch.update(parentRef, { studentInfo })

    await batch.commit()

    return { id: studentId }
  }

  async getStudent(id) {
    const doc = await db.collection(COLLECTIONS.STUDENT).doc(id).get()
    if (!doc.exists) throw new Error('Student not found')
    return { id: doc.id, ...doc.data() }
  }

  async getAllStudents() {
    const snapshot = await db.collection(COLLECTIONS.STUDENT).get()
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  }

  async getStudentsByParentID(parentId) {
    const snapshot = await db
      .collection(COLLECTIONS.STUDENT)
      .where('parentId', '==', parentId)
      .get()
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  }

  async updateStudent(id, updateData) {
    const validated = validateUpdateStudent(updateData)

    const studentRef = db.collection(COLLECTIONS.STUDENT).doc(id)
    const doc = await studentRef.get()

    if (!doc.exists) throw new Error('Student not found')

    const currentData = doc.data()
    const parentId = currentData.parentId

    let dobField = {}

    if (validated.dob) {
      const dobDate = new Date(validated.dob)
      if (isNaN(dobDate)) {
        throw new Error('Invalid Date of Birth')
      }
      dobField = { dob: dobDate }
    }

    let ageField = {}

    if (validated.age !== undefined && validated.age !== null) {
      ageField = { age: validated.age }
    } else if (dobField.dob) {
      ageField = { age: profileHelper.calculateAge(dobField.dob) }
    }

    const cleanUpdate = {
      ...(validated.name !== undefined && { name: validated.name }),
      ...dobField,
      ...ageField,
      ...(validated.profileURL !== undefined && {
        profileURL: validated.profileURL,
      }),
      ...(validated.status !== undefined && { status: validated.status }),
      updatedAt: new Date(),
    }
    const batch = db.batch()
    batch.update(studentRef, cleanUpdate)

    const syncFields = ['name', 'dob', 'profileURL', 'age']
    const shouldSync = Object.keys(cleanUpdate).some((k) =>
      syncFields.includes(k),
    )

    if (shouldSync) {
      const snapshot = profileHelper.getStudentSnapshot(id, {
        ...currentData,
        ...cleanUpdate,
      })

      await this.syncStudentMirrors(id, snapshot, parentId, batch)
    }

    await batch.commit()

    return { message: 'Updated successfully' }
  }

  async deleteStudent(id) {
    const studentRef = db.collection(COLLECTIONS.STUDENT).doc(id)
    const doc = await studentRef.get()
    if (!doc.exists) throw new Error('Student not found')

    const currentData = doc.data()
    const parentId = currentData.parentId

    const batch = db.batch()
    batch.delete(studentRef)

    const parentRef = db.collection(COLLECTIONS.PARENT).doc(parentId)
    const parentDoc = await parentRef.get()

    if (parentDoc.exists) {
      let studentInfo = [...(parentDoc.data().studentInfo || [])]
      studentInfo = studentInfo.filter((s) => s.id !== id)
      batch.update(parentRef, { studentInfo })
    }

    const enrollmentsSnap = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where('studentId', '==', id)
      .get()
    enrollmentsSnap.forEach((eDoc) => batch.delete(eDoc.ref))

    await batch.commit()

    return { message: 'Student deleted successfully' }
  }

  async syncStudentMirrors(sid, snapshot, parentId, batch) {
    const parentRef = db.collection(COLLECTIONS.PARENT).doc(parentId)
    const parentDoc = await parentRef.get()

    if (parentDoc.exists) {
      let studentInfo = [...(parentDoc.data().studentInfo || [])]
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

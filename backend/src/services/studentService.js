const { db, COLLECTIONS } = require('../config/database')
const profileHelper = require('../utils/profileHelper')
const dateHelper = require('../utils/dateHelper')
const {
  validateStudent,
  validateUpdateStudent,
} = require('../validators/studentValidator')

class StudentService {
  async createStudent(studentData, requestingUser = null) {
    const validated = validateStudent(studentData)
    const { parentId } = validated

    // Security: Only Admin or the Parent themselves can create a student for this parent
    if (requestingUser && requestingUser.role !== 'admin' && requestingUser.uid !== parentId) {
      throw new Error('Access Denied: You can only create students for your own account.')
    }

    const parentRef = db.collection(COLLECTIONS.PARENT).doc(parentId)
    const parentDoc = await parentRef.get()

    if (!parentDoc.exists) {
      throw new Error(`Parent not found with ID: ${parentId}`)
    }

    const pData = parentDoc.data()
    const parentInfo = profileHelper.getParentSnapshot(parentId, pData)

    const studentId = db.collection(COLLECTIONS.STUDENT).doc().id

    const dobDate = dateHelper.validateAndParseDate(validated.dob, 'Date of Birth')
    const cleanData = {
      parentId: validated.parentId,
      name: validated.name,
      dob: dobDate.toISOString(),
      age:
        validated.age ??
        (profileHelper.calculateAge ? profileHelper.calculateAge(dobDate) : 0),
      profileURL: validated.profileURL,
      status: validated.status,
      parentInfo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const snapshot = profileHelper.getStudentSnapshot(studentId, cleanData)
    const childrenInfo = [...(pData.childrenInfo || []), snapshot]

    const batch = db.batch()
    batch.set(db.collection(COLLECTIONS.STUDENT).doc(studentId), cleanData)
    batch.update(parentRef, { childrenInfo })
    await batch.commit()

    return { id: studentId }
  }

  async getAllStudents() {
    const snapshot = await db.collection(COLLECTIONS.STUDENT).get()
    return snapshot.docs.map((doc) =>
      profileHelper.ensureFreshAge({ id: doc.id, ...doc.data() }),
    )
  }

  async getStudent(id, requestingUser = null) {
    if (!id) throw new Error('Student ID is required')
    const doc = await db.collection(COLLECTIONS.STUDENT).doc(id).get()
    if (!doc.exists) throw new Error('Student not found')

    const data = profileHelper.ensureFreshAge({ id: doc.id, ...doc.data() })

    // Security: Only Admin or the Parent can view this student
    if (
      requestingUser &&
      requestingUser.role !== 'admin' &&
      requestingUser.uid !== data.parentId
    ) {
      throw new Error(
        'Access Denied: You do not have permission to view this student.',
      )
    }

    return data
  }

  async getStudentsByParentID(parentId, requestingUser = null) {
    // Security: Only Admin or the Parent themselves can list these students
    if (
      requestingUser &&
      requestingUser.role !== 'admin' &&
      requestingUser.uid !== parentId
    ) {
      throw new Error('Access Denied: You can only view your own children.')
    }

    const snapshot = await db
      .collection(COLLECTIONS.STUDENT)
      .where('parentId', '==', parentId)
      .get()
    return snapshot.docs.map((doc) =>
      profileHelper.ensureFreshAge({ id: doc.id, ...doc.data() }),
    )
  }

  async updateStudent(id, updateData, requestingUser = null) {
    if (!id) throw new Error('Student ID is required')
    
    const studentRef = db.collection(COLLECTIONS.STUDENT).doc(id)
    const studentDoc = await studentRef.get()

    if (!studentDoc.exists) throw new Error('Student not found')

    const currentStudentData = studentDoc.data()
    const parentId = currentStudentData.parentId

    // Security: Only Admin or the Parent can update this student
    if (requestingUser && requestingUser.role !== 'admin' && requestingUser.uid !== parentId) {
      throw new Error('Access Denied: You do not have permission to update this student.')
    }

    const validated = validateUpdateStudent(updateData)

    let dobField = {}
    if (validated.dob) {
      const dobDate = dateHelper.validateAndParseDate(validated.dob, 'Date of Birth')
      dobField = { dob: dobDate.toISOString() }
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
      updatedAt: new Date().toISOString(),
    }
    const batch = db.batch()
    batch.update(studentRef, cleanUpdate)

    const syncFields = ['name', 'dob', 'profileURL', 'age']
    const shouldSync = Object.keys(cleanUpdate).some((k) => syncFields.includes(k))

    if (shouldSync) {
      const snapshot = profileHelper.getStudentSnapshot(id, {
        ...currentStudentData,
        ...cleanUpdate,
      })
      await this.syncStudentMirrors(id, snapshot, parentId, batch)
    }

    await batch.commit()
    return { message: 'Updated successfully' }
  }

  async deleteStudent(id, requestingUser = null) {
    if (!id) throw new Error('Student ID is required for deletion')
    const studentRef = db.collection(COLLECTIONS.STUDENT).doc(id)
    const studentDoc = await studentRef.get()
    if (!studentDoc.exists) throw new Error('Student not found')

    const currentStudentData = studentDoc.data()
    const parentId = currentStudentData.parentId

    // Security: Only Admin or the Parent can delete this student
    if (requestingUser && requestingUser.role !== 'admin' && requestingUser.uid !== parentId) {
      throw new Error('Access Denied: You do not have permission to delete this student.')
    }

    const batch = db.batch()
    batch.delete(studentRef)

    const parentRef = db.collection(COLLECTIONS.PARENT).doc(parentId)
    const parentDoc = await parentRef.get()

    if (parentDoc.exists) {
      let childrenInfo = [...(parentDoc.data().childrenInfo || [])]
      childrenInfo = childrenInfo.filter((s) => s.id !== id)
      batch.update(parentRef, { childrenInfo })
    }

    const enrollmentsSnap = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where('studentId', '==', id)
      .get()
    enrollmentsSnap.forEach((eDoc) => batch.delete(eDoc.ref))

    await batch.commit()
    return { message: 'Student deleted successfully' }
  }

  // --- Utility & Mirroring Methods ---

  async syncStudentMirrors(sid, snapshot, parentId, batch) {
    const parentRef = db.collection(COLLECTIONS.PARENT).doc(parentId)
    const parentDoc = await parentRef.get()

    if (parentDoc.exists) {
      let childrenInfo = [...(parentDoc.data().childrenInfo || [])]
      const index = childrenInfo.findIndex((s) => s.id === sid)
      if (index !== -1) {
        childrenInfo[index] = snapshot
      } else {
        childrenInfo.push(snapshot)
      }
      batch.update(parentRef, { childrenInfo })
    }

    const enrollmentsSnap = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where('studentId', '==', sid)
      .get()
    enrollmentsSnap.forEach((eDoc) =>
      batch.update(eDoc.ref, { student: snapshot }),
    )
  }

  async clearStudentMirrors(id) {
    const [parentsSnap, enrollmentsSnap] = await Promise.all([
      db.collection(COLLECTIONS.PARENT).where('studentId', '==', id).get(),
      db.collection(COLLECTIONS.ENROLLMENT).where('studentId', '==', id).get(),
    ])

    const writes = [
      ...parentsSnap.docs.map((doc) => ({
        ref: doc.ref,
        data: { parentInfo: null },
      })),
      ...enrollmentsSnap.docs.map((doc) => ({
        ref: doc.ref,
        data: { student: null },
      })),
    ]

    await this._commitInChunks(writes)
  }

  async _commitInChunks(writes, incomingBatch = null) {
    if (incomingBatch) {
      writes.forEach(({ ref, data }) => incomingBatch.update(ref, data))
      return
    }

    const CHUNK_SIZE = 400
    for (let i = 0; i < writes.length; i += CHUNK_SIZE) {
      const batch = db.batch()
      writes
        .slice(i, i + CHUNK_SIZE)
        .forEach(({ ref, data }) => batch.update(ref, data))
      await batch.commit()
    }
  }
}

module.exports = new StudentService()

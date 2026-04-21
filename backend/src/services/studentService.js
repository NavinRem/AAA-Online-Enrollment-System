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
    const parentInfo = profileHelper.getParentSnapshot(parentId, pData)

    const studentId = db.collection(COLLECTIONS.STUDENT).doc().id

    const dobDate = this.validateAndParseDate(validated.dob)
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

  async getStudent(id) {
    if (!id) throw new Error('Student ID is required')
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
    if (!id) throw new Error('Student ID is required')
    const validated = validateUpdateStudent(updateData)

    const studentRef = db.collection(COLLECTIONS.STUDENT).doc(id)
    const studentDoc = await studentRef.get()

    if (!studentDoc.exists) throw new Error('Student not found')

    const currentStudentData = studentDoc.data()
    const parentId = currentStudentData.parentId

    let dobField = {}

    if (validated.dob) {
      const dobDate = this.validateAndParseDate(validated.dob)
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
    const shouldSync = Object.keys(cleanUpdate).some((k) =>
      syncFields.includes(k),
    )

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

  async deleteStudent(id) {
    if (!id) throw new Error('Student ID is required for deletion')
    const studentRef = db.collection(COLLECTIONS.STUDENT).doc(id)
    const studentDoc = await studentRef.get()
    if (!studentDoc.exists) throw new Error('Student not found')

    const currentStudentData = studentDoc.data()
    const parentId = currentStudentData.parentId

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

  validateAndParseDate(dateStr) {
    if (!dateStr) throw new Error('Date of Birth is required')

    const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/
    const match = dateStr.match(dateRegex)

    if (!match) {
      throw new Error(
        `Invalid Date format: "${dateStr}". Please use YYYY-MM-DD.`,
      )
    }

    const year = parseInt(match[1], 10)
    const month = parseInt(match[2], 10)
    const day = parseInt(match[3], 10)

    if (month < 1 || month > 12) {
      throw new Error(`Invalid Month: "${month}". Must be between 01 and 12.`)
    }

    const daysInMonth = new Date(year, month, 0).getDate()
    if (day < 1 || day > daysInMonth) {
      throw new Error(
        `Invalid Day: "${day}". Day must be between 01 and ${daysInMonth} for the selected month.`,
      )
    }

    const dateObj = new Date(year, month - 1, day)
    if (dateObj > new Date()) {
      throw new Error(`Date of Birth "${dateStr}" cannot be in the future.`)
    }

    return dateObj
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

const { db, COLLECTIONS } = require('../config/database')
const profileHelper = require('../utils/profileHelper')
const dateHelper = require('../utils/dateHelper')
const firestoreHelper = require('../utils/firestoreHelper')
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

    const dobStr = validated.dob // Expecting YYYY-MM-DD from validator
    const cleanData = {
      parentId: validated.parentId,
      name: validated.name,
      dob: dobStr,
      age:
        validated.age ??
        (profileHelper.calculateAge ? profileHelper.calculateAge(dobStr) : 0),
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
    return snapshot.docs
      .map((doc) => profileHelper.ensureFreshAge({ id: doc.id, ...doc.data() }))
      .filter((s) => s.isDeleted !== true)
  }

  async getStudent(id, requestingUser = null) {
    if (!id) throw new Error('Student ID is required')
    const doc = await db.collection(COLLECTIONS.STUDENT).doc(id).get()
    if (!doc.exists) throw new Error('Student not found')

    const data = profileHelper.ensureFreshAge({ id: doc.id, ...doc.data() })
    if (data.isDeleted) throw new Error('Student has been deleted')

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
      
    return snapshot.docs
      .map((doc) => profileHelper.ensureFreshAge({ id: doc.id, ...doc.data() }))
      .filter((s) => s.isDeleted !== true)
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
      dobField = { dob: validated.dob }
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
      ...(validated.parentId !== undefined && { parentId: validated.parentId }),
      ...(validated.overrideReason !== undefined && { overrideReason: validated.overrideReason }),
      ...(validated.overrideRemark !== undefined && { overrideRemark: validated.overrideRemark }),
      ...(validated.manualStatus !== undefined && { manualStatus: validated.manualStatus }),
      ...(validated.archived !== undefined && { archived: validated.archived }),
      updatedAt: new Date().toISOString(),
    }
    const writes = []
    writes.push({ ref: studentRef, data: cleanUpdate })

    // Handle parent transfer: move student between parents
    const effectiveParentId = validated.parentId || parentId
    if (validated.parentId && validated.parentId !== parentId) {
      const studentSnapshot = profileHelper.getStudentSnapshot(id, {
        ...currentStudentData,
        ...cleanUpdate,
      })

      // Remove from old parent's childrenInfo
      const oldParentRef = db.collection(COLLECTIONS.PARENT).doc(parentId)
      const oldParentDoc = await oldParentRef.get()
      if (oldParentDoc.exists) {
        let oldChildren = [...(oldParentDoc.data().childrenInfo || [])]
        oldChildren = oldChildren.filter((c) => c.id !== id)
        writes.push({ ref: oldParentRef, data: { childrenInfo: oldChildren } })
      }

      // Add to new parent's childrenInfo
      const newParentRef = db.collection(COLLECTIONS.PARENT).doc(validated.parentId)
      const newParentDoc = await newParentRef.get()
      if (!newParentDoc.exists) throw new Error('New parent not found')
      let newChildren = [...(newParentDoc.data().childrenInfo || [])]
      const existingIdx = newChildren.findIndex((c) => c.id === id)
      if (existingIdx === -1) {
        newChildren.push(studentSnapshot)
      } else {
        newChildren[existingIdx] = studentSnapshot
      }
      writes.push({ ref: newParentRef, data: { childrenInfo: newChildren } })

      // Update parentId in related enrollments
      const enrollSnap = await db
        .collection(COLLECTIONS.ENROLLMENT)
        .where('studentId', '==', id)
        .get()
      enrollSnap.forEach((eDoc) => {
        writes.push({ ref: eDoc.ref, data: { parentId: validated.parentId } })
      })

      // Update parentId in related trials
      const trialSnap = await db
        .collection(COLLECTIONS.TRIAL)
        .where('studentId', '==', id)
        .get()
      trialSnap.forEach((tDoc) => {
        writes.push({ ref: tDoc.ref, data: { parentId: validated.parentId } })
      })
    }

    const syncFields = ['name', 'dob', 'profileURL', 'age']
    const shouldSync = Object.keys(cleanUpdate).some((k) => syncFields.includes(k))

    if (shouldSync) {
      const snapshot = profileHelper.getStudentSnapshot(id, {
        ...currentStudentData,
        ...cleanUpdate,
      })
      const mirrorWrites = await this.getStudentMirrorOperations(id, snapshot, effectiveParentId)
      writes.push(...mirrorWrites)
    }

    await firestoreHelper.chunkedUpdate(writes)
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
    batch.update(studentRef, { 
      isDeleted: true, 
      status: 'deleted',
      updatedAt: new Date().toISOString() 
    })

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
    
    const affectedClassIds = [...new Set(enrollmentsSnap.docs.map(doc => doc.data().classId))]
    
    enrollmentsSnap.forEach((eDoc) => batch.update(eDoc.ref, { 
      isDeleted: true,
      status: 'cancelled',
      updatedAt: new Date().toISOString()
    }))

    await batch.commit()
    
    // Sync capacity for all affected classes
    if (affectedClassIds.length > 0) {
      const classService = require('./classService')
      await Promise.all(affectedClassIds.map(cid => classService.syncStudentCount(cid)))
    }

    return { message: 'Student deleted successfully (Soft delete)' }
  }

  // --- Utility & Mirroring Methods ---

  async getStudentMirrorOperations(sid, snapshot, parentId) {
    const writes = []
    
    // 1. Sync with Parent record
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
      writes.push({ ref: parentRef, data: { childrenInfo } })
    }

    // 2. Sync with Enrollment records
    const enrollmentsSnap = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where('studentId', '==', sid)
      .get()
    
    enrollmentsSnap.forEach((eDoc) => {
      writes.push({ ref: eDoc.ref, data: { student: snapshot } })
    })

    // 3. Sync with Trial records
    const trialsSnap = await db
      .collection(COLLECTIONS.TRIAL)
      .where('studentId', '==', sid)
      .get()
    
    trialsSnap.forEach((tDoc) => {
      writes.push({ ref: tDoc.ref, data: { student: snapshot } })
    })

    return writes
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

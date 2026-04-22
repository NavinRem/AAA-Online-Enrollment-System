const { db, COLLECTIONS } = require('../config/database')
const authService = require('./authService')
const profileHelper = require('../utils/profileHelper')
const {
  validateParent,
  validateUpdateParent,
} = require('../validators/parentValidator')

class ParentService {
  async createParent(parentData) {
    const validated = validateParent(parentData)
    const { studentId } = validated

    const studentRef = db.collection(COLLECTIONS.STUDENT).doc(studentId)
    const studentDoc = await studentRef.get()

    if (!studentDoc.exists) {
      throw new Error(`Student not found with ID: ${studentId}`)
    }

    const sData = studentDoc.data()
    const studentInfo = profileHelper.getStudentSnapshot(studentId, sData)

    const parentId = db.collection(COLLECTIONS.PARENT).doc().id

    const cleanData = {
      studentId: validated.studentId,
      name: validated.name,
      email: validated.email,
      phone: validated.phone,
      profileURL: validated.profileURL,
      status: validated.status,
      childrenInfo: [studentInfo],
    }

    const parentDoc = await db
      .collection(COLLECTIONS.PARENT)
      .doc(parentId)
      .get()
    if (parentDoc.exists) {
      throw new Error('Parent already exists')
    }

    const snapshot = profileHelper.getParentSnapshot(parentId, cleanData)
    const parentInfo = [...(sData.parentInfo || []), snapshot]

    const batch = db.batch()
    batch.set(db.collection(COLLECTIONS.PARENT).doc(parentId), cleanData)
    batch.update(studentRef, { parentInfo })
    await batch.commit()

    return { id: parentId }
  }

  async getAllParents(filters = {}) {
    let query = db.collection(COLLECTIONS.PARENT)
    if (filters.limit) query = query.limit(parseInt(filters.limit))
    
    const snapshot = await query.get()
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  }

  async getParent(id) {
    if (!id) throw new Error('Parent ID is required')
    const doc = await db.collection(COLLECTIONS.PARENT).doc(id).get()
    if (!doc.exists) throw new Error('Parent not found')
    return { id: doc.id, ...doc.data() }
  }

  async updateParent(id, updateData) {
    if (!id) throw new Error('Parent ID is required for update')
    const validatedUpdate = validateUpdateParent(updateData)

    const parentRef = db.collection(COLLECTIONS.PARENT).doc(id)
    const parentDoc = await parentRef.get()

    if (!parentDoc.exists) throw new Error('Parent not found')

    const currentParentData = parentDoc.data()
    const studentId = currentParentData.studentId

    const cleanUpdate = {
      ...(validatedUpdate.name && { name: validatedUpdate.name }),
      ...(validatedUpdate.email && { email: validatedUpdate.email }),
      ...(validatedUpdate.phone && { phone: validatedUpdate.phone }),
      ...(validatedUpdate.profileURL && { profileURL: validatedUpdate.profileURL }),
      ...(validatedUpdate.status && { status: validatedUpdate.status }),
    }

    const batch = db.batch()
    batch.update(parentRef, cleanUpdate)

    const syncFields = ['name', 'email', 'phone', 'profileURL', 'status']
    const shouldSync = Object.keys(cleanUpdate).some((k) => syncFields.includes(k))

    if (shouldSync) {
      const snapshot = profileHelper.getParentSnapshot(id, {
        ...currentParentData,
        ...cleanUpdate,
      })
      await this.syncParentMirrors(id, snapshot, studentId, batch)
    }

    await batch.commit()
    return { message: 'Updated successfully' }
  }

  async deleteParent(id) {
    if (!id) throw new Error('Parent ID is required for deletion')
    const parentRef = db.collection(COLLECTIONS.PARENT).doc(id)
    const parentDoc = await parentRef.get()

    if (!parentDoc.exists) throw new Error('Parent not found')

    const currentParentData = parentDoc.data()
    const studentId = currentParentData.studentId

    const batch = db.batch()
    batch.delete(parentRef)

    const studentRef = db.collection(COLLECTIONS.STUDENT).doc(studentId)
    const studentDoc = await studentRef.get()

    if (studentDoc.exists) {
      let parentInfo = [...(studentDoc.data().parentInfo || [])]
      parentInfo = parentInfo.filter((p) => p.id !== id)
      batch.update(studentRef, { parentInfo })
    }

    const enrollmentsSnap = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where('parentId', '==', id)
      .get()
    enrollmentsSnap.forEach((eDoc) => batch.delete(eDoc.ref))

    await batch.commit()
    await authService.deleteAccount(id)
    return { id, message: 'Parent deleted successfully from system' }
  }

  // --- Utility & Mirroring Methods ---

  async syncParentMirrors(pid, snapshot, studentId, batch) {
    const studentRef = db.collection(COLLECTIONS.STUDENT).doc(studentId)
    const studentDoc = await studentRef.get()

    if (studentDoc.exists) {
      let parentInfo = [...(studentDoc.data().parentInfo || [])]
      const index = parentInfo.findIndex((p) => p.id === pid)
      if (index !== -1) {
        parentInfo[index] = snapshot
      } else {
        parentInfo.push(snapshot)
      }
      batch.update(studentRef, { parentInfo })
    }

    const enrollmentsSnap = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where('parentId', '==', pid)
      .get()
    enrollmentsSnap.forEach((eDoc) =>
      batch.update(eDoc.ref, { parentInfo: snapshot }),
    )
  }

  async clearParentMirrors(id) {
    const [studentsSnap, enrollmentsSnap] = await Promise.all([
      db.collection(COLLECTIONS.STUDENT).where('parentId', '==', id).get(),
      db.collection(COLLECTIONS.ENROLLMENT).where('parentId', '==', id).get(),
    ])

    const writes = [
      ...studentsSnap.docs.map((doc) => ({
        ref: doc.ref,
        data: { parentInfo: null },
      })),
      ...enrollmentsSnap.docs.map((doc) => ({
        ref: doc.ref,
        data: { student: null },
      })),
    ]

    await this.commitInChunks(writes)
  }

  async commitInChunks(writes, incomingBatch = null) {
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

module.exports = new ParentService()

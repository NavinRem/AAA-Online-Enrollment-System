const { db, COLLECTIONS } = require('../config/database')
const authService = require('./authService')
const profileHelper = require('../utils/profileHelper')
const firestoreHelper = require('../utils/firestoreHelper')
const {
  validateParent,
  validateUpdateParent,
} = require('../validators/parentValidator')

class ParentService {
  async createParent(parentData) {
    const { email, password, studentId, ...profileData } = parentData
    const validatedProfile = validateParent({ email, studentId, ...profileData })

    // Contact Uniqueness Check (Phone)
    if (validatedProfile.phone) {
      const phoneSnap = await db.collection(COLLECTIONS.PARENT)
        .where('phone', '==', validatedProfile.phone)
        .limit(1)
        .get()
      if (!phoneSnap.empty) {
        throw new Error(`A parent with phone number "${validatedProfile.phone}" is already registered.`)
      }
    }

    const authResult = await authService.registerAccount(
      { email, password, ...validatedProfile },
      'parent',
      COLLECTIONS.PARENT,
    )

    if (studentId) {
      const studentRef = db.collection(COLLECTIONS.STUDENT).doc(studentId)
      const studentDoc = await studentRef.get()

      if (studentDoc.exists) {
        const sData = studentDoc.data()
        const studentInfo = profileHelper.getStudentSnapshot(studentId, sData)

        const parentRef = db.collection(COLLECTIONS.PARENT).doc(authResult.id)
        const snapshot = profileHelper.getParentSnapshot(authResult.id, validatedProfile)
        const parentInfoList = [...(sData.parentInfo || []), snapshot]

        const batch = db.batch()
        batch.update(parentRef, { childrenInfo: [studentInfo] })
        batch.update(studentRef, { parentInfo: parentInfoList })
        await batch.commit()
      }
    }

    return authResult
  }

  async getAllParents(filters = {}) {
    const snapshot = await db.collection(COLLECTIONS.PARENT).get()
    const data = snapshot.docs
      .map((doc) => profileHelper.ensureFreshAge({ id: doc.id, ...doc.data() }))
      .filter((p) => p.isDeleted !== true)

    if (filters.limit) return data.slice(0, parseInt(filters.limit))
    return data
  }

  async getParent(id) {
    if (!id) throw new Error('Parent ID is required')
    const doc = await db.collection(COLLECTIONS.PARENT).doc(id).get()
    if (!doc.exists) throw new Error('Parent not found')
    const data = profileHelper.ensureFreshAge({ id: doc.id, ...doc.data() })
    if (data.isDeleted) throw new Error('Parent has been deleted')
    return data
  }

  async updateParent(id, updateData) {
    if (!id) throw new Error('Parent ID is required for update')
    const validatedUpdate = validateUpdateParent(updateData)

    const parentRef = db.collection(COLLECTIONS.PARENT).doc(id)
    const parentDoc = await parentRef.get()

    if (!parentDoc.exists) throw new Error('Parent not found')

    const currentParentData = parentDoc.data()
    const childrenInfo = currentParentData.childrenInfo || []

    const cleanUpdate = {
      ...(validatedUpdate.name && { name: validatedUpdate.name }),
      ...(validatedUpdate.email && { email: validatedUpdate.email }),
      ...(validatedUpdate.phone && { phone: validatedUpdate.phone }),
      ...(validatedUpdate.profileURL && {
        profileURL: validatedUpdate.profileURL,
      }),
      ...(validatedUpdate.status && { status: validatedUpdate.status }),
      ...(validatedUpdate.childrenInfo && { childrenInfo: validatedUpdate.childrenInfo }),
    }

    const writes = []
    writes.push({ ref: parentRef, data: cleanUpdate })

    const syncFields = ['name', 'email', 'phone', 'profileURL', 'status']
    const shouldSync = Object.keys(cleanUpdate).some((k) =>
      syncFields.includes(k),
    )

    if (shouldSync) {
      const snapshot = profileHelper.getParentSnapshot(id, {
        ...currentParentData,
        ...cleanUpdate,
      })
      const mirrorWrites = await this.getParentMirrorOperations(id, snapshot, childrenInfo)
      writes.push(...mirrorWrites)
    }

    await firestoreHelper.chunkedUpdate(writes)
    return { message: 'Updated successfully' }
  }

  async deleteParent(id) {
    if (!id) throw new Error('Parent ID is required for deletion')
    const parentRef = db.collection(COLLECTIONS.PARENT).doc(id)
    const parentDoc = await parentRef.get()

    if (!parentDoc.exists) throw new Error('Parent not found')

    const currentParentData = parentDoc.data()
    const childrenInfo = currentParentData.childrenInfo || []

    const writes = []
    writes.push({
      ref: parentRef,
      data: { isDeleted: true, status: 'deleted', updatedAt: new Date().toISOString() }
    })

    if (childrenInfo && childrenInfo.length > 0) {
      for (const child of childrenInfo) {
        if (!child.id) continue
        const studentService = require('./studentService')
        // We reuse the student soft delete logic
        await studentService.deleteStudent(child.id)
      }
    }

    const enrollmentsSnap = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where('parentId', '==', id)
      .get()
    
    enrollmentsSnap.forEach((eDoc) => {
      writes.push({
        ref: eDoc.ref,
        data: { isDeleted: true, status: 'cancelled', updatedAt: new Date().toISOString() }
      })
    })

    await firestoreHelper.chunkedUpdate(writes)
    // Note: We keep the auth account but mark it as deleted in DB. 
    // In a real production app, you might want to disable the account in Firebase Auth.
    
    return { id, message: 'Parent and related data soft-deleted successfully' }
  }

  // --- Utility & Mirroring Methods ---

  async getParentMirrorOperations(pid, snapshot, childrenInfo) {
    const writes = []
    if (childrenInfo && childrenInfo.length > 0) {
      for (const child of childrenInfo) {
        if (!child.id) continue
        const studentRef = db.collection(COLLECTIONS.STUDENT).doc(child.id)
        const studentDoc = await studentRef.get()

        if (studentDoc.exists) {
          let parentInfo = [...(studentDoc.data().parentInfo || [])]
          const index = parentInfo.findIndex((p) => p.id === pid)
          if (index !== -1) {
            parentInfo[index] = snapshot
          } else {
            parentInfo.push(snapshot)
          }
          writes.push({ ref: studentRef, data: { parentInfo } })
        }
      }
    }

    const enrollmentsSnap = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where('parentId', '==', pid)
      .get()
      
    enrollmentsSnap.forEach((eDoc) =>
      writes.push({ ref: eDoc.ref, data: { parent: snapshot } })
    )

    // 3. Sync with Trial records
    const trialsSnap = await db
      .collection(COLLECTIONS.TRIAL)
      .where('parentId', '==', pid)
      .get()
    
    trialsSnap.forEach((tDoc) =>
      writes.push({ ref: tDoc.ref, data: { parent: snapshot } })
    )
    
    return writes
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

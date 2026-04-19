const { db, COLLECTIONS } = require('../config/database')
const authService = require('./authService')
const profileHelper = require('../utils/profileHelper')
const { validateUpdateParent } = require('../validators/parentValidator')

const SYNC_PARENT_FIELDS = ['name', 'email', 'phone', 'profileURL', 'status']

class ParentService {
  async registerParent(parentData) {
    return authService.registerAccount(parentData, 'parent', COLLECTIONS.PARENT)
  }

  async getParent(id) {
    if (!id) throw new Error('Parent ID is required')
    const doc = await db.collection(COLLECTIONS.PARENT).doc(id).get()
    if (!doc.exists) throw new Error('Parent not found')
    return { id: doc.id, ...doc.data() }
  }

  async getAllParents({ limit = 10, startAfter = null } = {}) {
    let query = db.collection(COLLECTIONS.PARENT).limit(limit)
    if (startAfter) {
      const cursor = await db
        .collection(COLLECTIONS.PARENT)
        .doc(startAfter)
        .get()
      if (cursor.exists) query = query.startAfter(cursor)
    }
    const snapshot = await query.get()
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  }

  async updateParent(id, updateData) {
    if (!id) throw new Error('Parent ID is required for update')
    const validatedData = validateUpdateParent(updateData)

    const ref = db.collection(COLLECTIONS.PARENT).doc(id)
    const doc = await ref.get()
    if (!doc.exists) throw new Error('Parent not found')

    const batch = db.batch()
    batch.update(ref, validatedData)

    const shouldSync = Object.keys(updateData).some((key) =>
      SYNC_PARENT_FIELDS.includes(key),
    )

    if (shouldSync) {
      await this.syncParentMirrors(id, ref, batch)
    }

    await batch.commit()
    const updatedDoc = await ref.get()
    return { id: updatedDoc.id, ...updatedDoc.data() }
  }

  async deleteParent(id) {
    if (!id) throw new Error('Parent ID is required for deletion')
    const ref = db.collection(COLLECTIONS.PARENT).doc(id)
    const doc = await ref.get()

    if (!doc.exists) throw new Error('Parent not found')

    await this.clearParentMirrors(id)

    await ref.delete()
    await authService.deleteAccount(id)

    return { id, message: 'Parent deleted successfully from system' }
  }

  async syncParentMirrors(id, userRef = null, incomingBatch = null) {
    const ref = userRef || db.collection(COLLECTIONS.PARENT).doc(id)
    const userDoc = await ref.get()
    if (!userDoc.exists) return

    const userData = userDoc.data()
    const snapshot = profileHelper.getUserSnapshot(id, userData)

    const [studentsSnap, enrollmentsSnap] = await Promise.all([
      db.collection(COLLECTIONS.STUDENT).where('parentId', '==', id).get(),
      db.collection(COLLECTIONS.ENROLLMENT).where('parentId', '==', id).get(),
    ])

    const writes = [
      ...studentsSnap.docs.map((sDoc) => ({
        ref: sDoc.ref,
        data: { parentInfo: snapshot },
      })),
      ...enrollmentsSnap.docs.map((eDoc) => ({
        ref: eDoc.ref,
        data: { parentInfo: snapshot },
      })),
    ]

    await this._commitInChunks(writes, incomingBatch)
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
        data: { parentInfo: null },
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

module.exports = new ParentService()

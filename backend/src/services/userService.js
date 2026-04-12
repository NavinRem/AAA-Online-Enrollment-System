const { getAuth } = require('firebase-admin/auth')
const { db, COLLECTIONS } = require('../config/database')
const profileHelper = require('../utils/profileHelper')

class UserService {
  async _registerAccount(userData, defaultRole, collection) {
    let { uid, email, name, phone, password, role } = userData
    let targetRole = (role || defaultRole).toLowerCase()
    let generatedPassword = null

    if (targetRole === 'guardian') targetRole = 'parent'

    if (!uid) {
      if (!email) throw new Error('Email is required to create an account')
      try {
        const userConfig = { email, displayName: name || null }

        if (!password) {
          generatedPassword = 'AAA123456'
          password = generatedPassword
        }

        userConfig.password = password
        const userRecord = await getAuth().createUser(userConfig)
        uid = userRecord.uid
      } catch (error) {
        if (error.code === 'auth/email-already-exists') {
          const userRecord = await getAuth().getUserByEmail(email)
          uid = userRecord.uid
        } else throw error
      }
    }

    await getAuth().setCustomUserClaims(uid, { role: targetRole })

    const docRef = db.collection(collection).doc(uid)
    const now = new Date().toISOString()

    const data = {
      email: email || null,
      role: targetRole,
      name: name || null,
      profileURL: userData.profileURL || null,
      phone: phone || null,
      status: userData.status || 'Active',
      updatedAt: now,
    }

    const doc = await docRef.get()
    if (!doc.exists) {
      data.createdAt = now
      data.mustChangePassword = true // Enforce change on mobile interface
    }

    await docRef.set(data, { merge: true })

    return {
      uid,
      role: targetRole,
      message: `Account registered successfully in ${collection}`,
      isNew: !doc.exists,
      tempPassword: generatedPassword,
    }
  }

  async manualPasswordReset(uid) {
    const user = await this.getUser(uid)
    const collection =
      user.role === 'admin' ? COLLECTIONS.ADMIN : COLLECTIONS.PARENT

    // Generate a fresh temporary password for the reset (easy to read but randomized enough)
    const tempPassword = `AAA${Math.floor(100000 + Math.random() * 900000)}`

    // Update Auth password
    await getAuth().updateUser(uid, { password: tempPassword })

    // Mark as needing change in Firestore
    const docRef = db.collection(collection).doc(uid)
    await docRef.update({
      mustChangePassword: true,
      updatedAt: new Date().toISOString(),
    })

    return {
      uid,
      tempPassword,
      message:
        'Password reset successfully. The user must change it on their next login.',
    }
  }

  async registerParentAccount(userData) {
    return this._registerAccount(userData, 'parent', COLLECTIONS.PARENT)
  }

  async registerAdminAccount(userData) {
    return this._registerAccount(userData, 'admin', COLLECTIONS.ADMIN)
  }

  async getParentAccount(uid) {
    if (!uid) throw new Error('Parent ID is required')
    const doc = await db.collection(COLLECTIONS.PARENT).doc(uid).get()
    if (!doc.exists) throw new Error(`Parent not found with ID: ${uid}`)

    return { uid: doc.id, ...doc.data() }
  }

  async getAllParentAccounts() {
    const snapshot = await db.collection(COLLECTIONS.PARENT).get()
    return snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }))
  }

  async getUser(uid) {
    const adminDoc = await db.collection(COLLECTIONS.ADMIN).doc(uid).get()
    if (adminDoc.exists) return { uid, ...adminDoc.data() }

    const parentDoc = await db.collection(COLLECTIONS.PARENT).doc(uid).get()
    if (parentDoc.exists) return { uid, ...parentDoc.data() }

    throw new Error('User profile not found in system')
  }

  /**
   * Returns a standardized snapshot of a user.
   * This is now the entry point for other services to get mirrored data.
   */
  getUserSnapshot(uid, userData) {
    return profileHelper.getUserSnapshot(uid, userData)
  }

  async getUserRole(uid) {
    try {
      const userRecord = await getAuth().getUser(uid)
      if (userRecord.customClaims && userRecord.customClaims.role) {
        return { uid: userRecord.uid, role: userRecord.customClaims.role }
      }
    } catch (err) {
      console.warn(
        `Auth check failed for ${uid}, falling back to Firestore:`,
        err.message,
      )
    }

    const user = await this.getUser(uid)
    return { uid, role: user.role || 'parent' }
  }

  async getAllUsers() {
    const parents = await this.getAllParentAccounts()
    const admins = await db.collection(COLLECTIONS.ADMIN).get()
    const adminList = admins.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    }))
    return [...parents, ...adminList]
  }

  async updateUser(uid, updateData) {
    const adminDoc = await db.collection(COLLECTIONS.ADMIN).doc(uid).get()
    const collection = adminDoc.exists ? COLLECTIONS.ADMIN : COLLECTIONS.PARENT

    const docRef = db.collection(collection).doc(uid)
    const doc = await docRef.get()
    if (!doc.exists) throw new Error('User not found')

    const batch = db.batch()
    const now = new Date().toISOString()

    const cleanData = { ...updateData, updatedAt: now }

    delete cleanData.uid
    delete cleanData.createdAt

    if (cleanData.role) {
      await getAuth().setCustomUserClaims(uid, { role: cleanData.role })
    }

    batch.set(docRef, cleanData, { merge: true })

    const syncFields = [
      'name',
      'email',
      'phone',
      'profileURL',
      'role',
      'status',
    ]
    const shouldSync = Object.keys(updateData).some((key) =>
      syncFields.includes(key),
    )

    if (shouldSync) {
      await this._syncUserMirrors(uid, docRef, batch, collection)
    }

    await batch.commit()
    return { uid, message: 'User updated successfully' }
  }

  async _syncUserMirrors(
    uid,
    userRef,
    incomingBatch = null,
    collection = COLLECTIONS.PARENT,
  ) {
    const userDoc = await userRef.get()
    if (!userDoc.exists) return

    const userData = userDoc.data()
    const snapshot = profileHelper.getUserSnapshot(uid, userData)

    const batch = incomingBatch || db.batch()

    const studentsSnap = await db
      .collection(COLLECTIONS.STUDENT)
      .where('parentId', '==', uid)
      .get()
    studentsSnap.forEach((sDoc) =>
      batch.update(sDoc.ref, { parentInfo: snapshot }),
    )

    const enrollmentsSnap = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where('parentId', '==', uid)
      .get()
    enrollmentsSnap.forEach((eDoc) =>
      batch.update(eDoc.ref, { parent: snapshot }),
    )

    if (!incomingBatch) await batch.commit()
  }
}

module.exports = new UserService()

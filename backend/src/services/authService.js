const { getAuth } = require('firebase-admin/auth')
const { db, COLLECTIONS } = require('../config/database')
const bcrypt = require('bcryptjs')

const { validateParent } = require('../validators/parentValidator')
const { validateAdmin } = require('../validators/adminValidator')
const { validateTeacher } = require('../validators/teacherValidator')

class AuthService {
  async registerAccount(userData, defaultRole, collection) {
    let targetRole = (userData.role || defaultRole).toLowerCase()
    if (targetRole === 'guardian') targetRole = 'parent'

    const {
      id: providedId,
      password: providedPassword,
      email: providedEmail,
      ...businessData
    } = userData
    delete businessData.role

    const validatedData = this.validateByRole(targetRole, {
      email: providedEmail,
      ...businessData,
    })

    let id = providedId
    let email = providedEmail
    let password = providedPassword
    let generatedPassword = null

    if (!id) {
      if (!email) throw new Error('Email is required to create an account')
      try {
        const userConfig = { email, displayName: validatedData.name }

        if (!password) {
          generatedPassword = 'AAA123456'
          password = generatedPassword
        }

        userConfig.password = password
        const userRecord = await getAuth().createUser(userConfig)
        id = userRecord.uid
      } catch (error) {
        if (error.code === 'auth/email-already-exists') {
          const userRecord = await getAuth().getUserByEmail(email)
          id = userRecord.uid
        } else throw error
      }
    }

    await getAuth().setCustomUserClaims(id, { role: targetRole })

    const docRef = db.collection(collection).doc(id)
    const now = new Date().toISOString()

    const data = {
      ...validatedData,
      role: targetRole,
      updatedAt: now,
    }

    if (password) {
      const salt = await bcrypt.genSalt(10)
      data.passwordHash = await bcrypt.hash(password, salt)
    }

    const doc = await docRef.get()
    if (!doc.exists) {
      data.createdAt = now
      data.mustChangePassword = true
      if (targetRole === 'parent') {
        data.childrenInfo = []
      }
    }

    await docRef.set(data, { merge: true })

    return {
      id,
      role: targetRole,
      message: `Account registered successfully in ${collection}`,
      isNew: !doc.exists,
      tempPassword: generatedPassword,
    }
  }

  async getUser(id) {
    if (!id) throw new Error('User ID is required')

    const collections = [
      COLLECTIONS.ADMIN,
      COLLECTIONS.PARENT,
      COLLECTIONS.TEACHER,
    ]
    for (const col of collections) {
      const doc = await db.collection(col).doc(id).get()
      if (doc.exists) return { id: doc.id, ...doc.data() }
    }
    throw new Error('User profile not found in system')
  }

  async getUserRole(id) {
    try {
      const userRecord = await getAuth().getUser(id)
      if (userRecord.customClaims && userRecord.customClaims.role) {
        return { id: userRecord.uid, role: userRecord.customClaims.role }
      }
    } catch (err) {
      console.warn(
        `Auth check failed for ${id}, falling back to Firestore:`,
        err.message,
      )
    }

    const user = await this.getUser(id)
    return { id, role: user.role }
  }

  async manualPasswordReset(id) {
    const user = await this.getUser(id)
    const collection = this.getCollectionByRole(user.role)

    const tempPassword = `AAA${Math.floor(100000 + Math.random() * 900000)}`
    await getAuth().updateUser(id, { password: tempPassword })

    const docRef = db.collection(collection).doc(id)
    const update = {
      mustChangePassword: true,
      updatedAt: new Date().toISOString(),
    }

    const salt = await bcrypt.genSalt(10)
    update.passwordHash = await bcrypt.hash(tempPassword, salt)

    await docRef.update(update)

    return {
      id,
      tempPassword,
      message:
        'Password reset successfully. The user must change it on their next login.',
    }
  }

  async deleteAccount(id) {
    if (!id) throw new Error('User ID is required for deletion')
    try {
      await getAuth().deleteUser(id)
      return { success: true, message: 'Auth account deleted successfully' }
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.warn(`Auth account ${id} not found, skipping auth deletion.`)
        return { success: true, message: 'Auth account already missing' }
      }
      throw error
    }
  }

  // --- Utility & Role Management ---

  validateByRole(role, data) {
    switch (role?.toLowerCase()) {
      case 'admin':
        return validateAdmin(data)
      case 'parent':
      case 'guardian':
        return validateParent(data)
      case 'teacher':
        return validateTeacher(data)
      default:
        return true
    }
  }

  getCollectionByRole(role) {
    switch (role?.toLowerCase()) {
      case 'admin':
        return COLLECTIONS.ADMIN
      case 'parent':
      case 'guardian':
        return COLLECTIONS.PARENT
      case 'teacher':
        return COLLECTIONS.TEACHER
      default:
        return COLLECTIONS.PARENT
    }
  }
}

module.exports = new AuthService()

const { db, COLLECTIONS } = require('../config/database')
const authService = require('./authService')
const {
  validateAdmin,
  validateUpdateAdmin,
} = require('../validators/adminValidator')

class AdminService {
  async createAdmin(adminData) {
    const { email, password, ...profileData } = adminData
    const validatedProfile = validateAdmin({ email, ...profileData })

    return authService.registerAccount(
      { password, ...validatedProfile },
      'admin',
      COLLECTIONS.ADMIN,
    )
  }

  async getAllAdmins(filters = {}) {
    let query = db.collection(COLLECTIONS.ADMIN)

    if (filters.status) query = query.where('status', '==', filters.status)

    const snapshot = await query.get()
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  }

  async getAdmin(id) {
    if (!id) throw new Error('Admin ID is required')
    const doc = await db.collection(COLLECTIONS.ADMIN).doc(id).get()
    if (!doc.exists) throw new Error('Admin not found')
    return { id: doc.id, ...doc.data() }
  }

  async updateAdmin(id, updateData) {
    if (!id) throw new Error('Admin ID is required for update')
    const validatedUpdate = validateUpdateAdmin(updateData)

    const ref = db.collection(COLLECTIONS.ADMIN).doc(id)
    const doc = await ref.get()
    if (!doc.exists) throw new Error('Admin not found')

    await ref.update(validatedUpdate)
    return { id, ...validatedUpdate }
  }

  async deleteAdmin(id) {
    if (!id) throw new Error('Admin ID is required')

    const snapshot = await db.collection(COLLECTIONS.ADMIN).get()
    if (snapshot.size <= 1) {
      throw new Error('Cannot delete the only remaining administrator.')
    }

    await db.collection(COLLECTIONS.ADMIN).doc(id).delete()
    return { message: 'Admin deleted successfully' }
  }
}

module.exports = new AdminService()

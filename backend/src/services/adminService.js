const { db, COLLECTIONS } = require('../config/database')
const authService = require('./authService')
const { validateAdmin, validateUpdateAdmin } = require('../validators/adminValidator')

class AdminService {
  async registerAdmin(adminData) {
    return authService.registerAccount(adminData, 'admin', COLLECTIONS.ADMIN)
  }

  async getAdmin(id) {
    if (!id) throw new Error('Admin ID is required')
    const doc = await db.collection(COLLECTIONS.ADMIN).doc(id).get()
    if (!doc.exists) throw new Error('Admin not found')
    return { id: doc.id, ...doc.data() }
  }

  async getAllAdmins() {
    const snapshot = await db.collection(COLLECTIONS.ADMIN).get()
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
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
    if (!id) throw new Error('Admin ID is required for deletion')
    const ref = db.collection(COLLECTIONS.ADMIN).doc(id)
    const doc = await ref.get()

    if (doc.exists) {
      await ref.delete()
    }

    await authService.deleteAccount(id)
    return { id, message: 'Admin deleted successfully' }
  }
}

module.exports = new AdminService()

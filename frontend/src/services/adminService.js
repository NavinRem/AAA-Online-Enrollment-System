import { firestore as db } from '@/firebase'
import { collection, doc, getDocs, getDoc, query, where } from 'firebase/firestore'
import { request } from './api'

const ADMINS_COLLECTION = 'admins'

export const adminService = {
  /**
   * Fetch all authorized administrators from Firestore
   */
  async getAllAdmins() {
    try {
      if (!db) return []
      const q = query(collection(db, ADMINS_COLLECTION))
      const snapshot = await getDocs(q)
      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }))
    } catch (error) {
      console.error('Failed to fetch admins from Firestore:', error)
      return []
    }
  },

  /**
   * Fetch an administrator by ID or email
   */
  async getAdminById(adminId) {
    try {
      if (!db || !adminId) return null
      const docRef = doc(db, ADMINS_COLLECTION, String(adminId))
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      }
      return null
    } catch (error) {
      console.error('Failed to get admin by ID:', error)
      return null
    }
  },

  async getAdminByEmail(email) {
    try {
      if (!db || !email) return null
      const q = query(collection(db, ADMINS_COLLECTION), where('email', '==', email.trim()))
      const snapshot = await getDocs(q)
      if (!snapshot.empty) {
        const first = snapshot.docs[0]
        return { id: first.id, ...first.data() }
      }
      return null
    } catch (error) {
      console.error('Failed to get admin by email:', error)
      return null
    }
  },

  /**
   * Create a new administrator — delegates to backend API so Firebase
   * custom claims (role: 'admin') are set correctly via Admin SDK.
   */
  async createAdmin(adminData) {
    return request('/admins', {
      method: 'POST',
      body: JSON.stringify({
        name: adminData.name || '',
        email: adminData.email || '',
        branch: adminData.branch || '',
        phone: adminData.phone || '',
        profileURL: adminData.profileURL || '',
        status: adminData.status || 'active',
        password: adminData.password || undefined,
      }),
    })
  },

  /**
   * Update an existing administrator profile and branch assignment via backend API.
   */
  async updateAdmin(adminId, updatedFields) {
    if (!adminId) throw new Error('Invalid Admin ID')
    // Strip client-only fields before sending to backend
    const { password: _p, confirmPassword: _cp, id: _id, ...safeFields } = updatedFields
    void _p
    void _cp
    void _id
    return request(`/admins/${adminId}`, {
      method: 'PATCH',
      body: JSON.stringify(safeFields),
    })
  },

  /**
   * Delete an administrator record via backend API.
   */
  async deleteAdmin(adminId) {
    if (!adminId) throw new Error('Invalid Admin ID')
    return request(`/admins/${adminId}`, { method: 'DELETE' })
  },
}

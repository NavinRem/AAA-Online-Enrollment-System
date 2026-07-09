import { firestore as db } from '@/firebase'
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore'

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
   * Create a new administrator record in Firestore
   */
  async createAdmin(adminData) {
    try {
      if (!db) throw new Error('Firestore not initialized')
      const docId = adminData.id || `admin_${Date.now()}`
      const payload = {
        name: adminData.name || '',
        email: adminData.email || '',
        branch: adminData.branch || '',
        role: adminData.role || 'Administrator',
        profileURL: adminData.profileURL || '',
        identityProvider: adminData.identityProvider || 'Proved Identity',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await setDoc(doc(db, ADMINS_COLLECTION, docId), payload)
      return { id: docId, ...payload }
    } catch (error) {
      console.error('Failed to create admin in Firestore:', error)
      throw error
    }
  },

  /**
   * Update an existing administrator profile and branch assignment
   */
  async updateAdmin(adminId, updatedFields) {
    try {
      if (!db || !adminId) throw new Error('Invalid Admin ID')
      const docRef = doc(db, ADMINS_COLLECTION, String(adminId))
      const payload = {
        ...updatedFields,
        updatedAt: new Date().toISOString(),
      }
      await updateDoc(docRef, payload)
      return { id: adminId, ...payload }
    } catch (error) {
      console.error('Failed to update admin in Firestore:', error)
      throw error
    }
  },

  /**
   * Delete an administrator record
   */
  async deleteAdmin(adminId) {
    try {
      if (!db || !adminId) throw new Error('Invalid Admin ID')
      await deleteDoc(doc(db, ADMINS_COLLECTION, String(adminId)))
      return true
    } catch (error) {
      console.error('Failed to delete admin from Firestore:', error)
      throw error
    }
  },
}

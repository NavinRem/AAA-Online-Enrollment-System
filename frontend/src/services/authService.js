import { auth } from '../firebase'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { request } from './api'

export const authService = {
  async login(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const token = await userCredential.user.getIdToken()
    return {
      user: userCredential.user,
      token,
    }
  },

  logout() {
    return signOut(auth)
  },

  onAuthStateChanged(callback) {
    if (typeof window !== 'undefined' && window.__playwright_mock_auth__) {
      setTimeout(() => {
        callback({
          uid: 'admin-1',
          email: 'admin@aaa.com',
          displayName: 'Admin User',
          getIdToken: async () => 'mock-token'
        })
      }, 0)
      return () => {}
    }
    return onAuthStateChanged(auth, callback)
  },

  getCurrentUser() {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe()
        resolve(user)
      })
    })
  },

  sendPasswordReset(email) {
    return sendPasswordResetEmail(auth, email)
  },

  getMe() {
    return request('/auth/me')
  },

  getUserProfile(uid) {
    return request(`/auth/profile/${uid}`)
  },

  getUserRole(uid) {
    return request(`/auth/role/${uid}`)
  },

  getAllUsers() {
    return request('/auth/all')
  },

  adminResetPassword(uid) {
    return request(`/auth/reset-password/${uid}`, { method: 'POST' })
  },

  registerParent(parentData) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(parentData),
    })
  },
}

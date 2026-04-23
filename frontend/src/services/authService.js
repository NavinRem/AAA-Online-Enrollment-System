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
    return onAuthStateChanged(auth, callback)
  },

  getCurrentUser() {
    return auth.currentUser
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

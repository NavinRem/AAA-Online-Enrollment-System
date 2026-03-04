import { auth } from '../firebase'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth'

export const authService = {
  // Sign up with email and password
  async register(email, password) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    return userCredential.user
  },

  // Login with email and password
  async login(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  },

  // Logout
  async logout() {
    await signOut(auth)
  },

  // Observe user state changes
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback)
  },

  // Get current user
  getCurrentUser() {
    return auth.currentUser
  },

  // Reset Password
  async resetPassword(email) {
    await sendPasswordResetEmail(auth, email)
  },
}

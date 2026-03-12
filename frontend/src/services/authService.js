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
  register(email, password) {
    return createUserWithEmailAndPassword(auth, email, password)
      .then(userCredential => userCredential.user)
  },

  // Login with email and password
  login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
      .then(userCredential => userCredential.user)
  },

  // Logout
  logout() {
    return signOut(auth)
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
  resetPassword(email) {
    return sendPasswordResetEmail(auth, email)
  },
}

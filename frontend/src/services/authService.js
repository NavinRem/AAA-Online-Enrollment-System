import { auth } from '../firebase'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth'

export const authService = {
  async register(email, password) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const token = await userCredential.user.getIdToken()
    return { user: userCredential.user, token }
  },

  async login(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)

    const token = await userCredential.user.getIdToken()

    console.log('AUTH TOKEN:', token)

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

  resetPassword(email) {
    return sendPasswordResetEmail(auth, email)
  },
}

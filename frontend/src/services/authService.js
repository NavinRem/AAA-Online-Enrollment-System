import { auth } from '../firebase'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth'

export const authService = {
  register(email, password) {
    return createUserWithEmailAndPassword(auth, email, password).then(
      (userCredential) => userCredential.user,
    )
  },
  login(email, password) {
    return signInWithEmailAndPassword(auth, email, password).then(
      (userCredential) => userCredential.user,
    )
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

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { auth } from '@/firebase'
import { request } from './api'

export const parentAuthService = {
  async register({ name, email, password, phone }) {
    // Public endpoint — creates Firebase Auth user + Firestore parent doc + sets role claim
    const result = await request('/parents/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone }),
    })
    // Immediately log in after successful registration
    await signInWithEmailAndPassword(auth, email, password)
    return result
  },

  async registerWithTelegramOrPhone({ name, phone, telegramHandle, password }) {
    // Normalize phone or telegram handle into a stable pseudo-email anchor so Firebase email/password works seamlessly
    const cleanIdentifier = (phone || telegramHandle || '').replace(/[^a-zA-Z0-9+_]/g, '')
    const syntheticEmail = `${cleanIdentifier.toLowerCase()}@telegram.aaa.edu`
    const result = await request('/parents/register', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email: syntheticEmail,
        password,
        phone: phone || telegramHandle,
        telegramHandle: telegramHandle || '',
      }),
    })
    await signInWithEmailAndPassword(auth, syntheticEmail, password)
    return { ...result, syntheticEmail }
  },

  async login(emailOrPhone, password) {
    let targetEmail = emailOrPhone
    if (!emailOrPhone.includes('@')) {
      const cleanIdentifier = emailOrPhone.replace(/[^a-zA-Z0-9+_]/g, '')
      targetEmail = `${cleanIdentifier.toLowerCase()}@telegram.aaa.edu`
    }
    const cred = await signInWithEmailAndPassword(auth, targetEmail, password)
    return cred.user
  },

  logout() {
    return signOut(auth)
  },

  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback)
  },

  sendPasswordReset(email) {
    return sendPasswordResetEmail(auth, email)
  },

  getMyProfile() {
    return request('/parents/me')
  },
}

export const parentPortalService = {
  getMyChildren: () => request('/parents/my-children'),
  getMyEnrollments: () => request('/parents/my-enrollments'),
  getChildAttendance: (studentId) => request(`/parents/attendance/${studentId}`),
  getChildPerformance: (studentId) => request(`/performance/student/${studentId}`),
  getAvailableClasses: () => request('/parents/classes/available'),
  selfEnroll: (payload) =>
    request('/parents/self-enroll', { method: 'POST', body: JSON.stringify(payload) }),
  uploadPaymentProof: (enrollmentId, payload) =>
    request(`/parents/upload-payment-proof/${enrollmentId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  initiatePayment: (payload) =>
    request('/payments/initiate', { method: 'POST', body: JSON.stringify(payload) }),
  verifyPayment: (transactionId) =>
    request('/payments/verify', { method: 'POST', body: JSON.stringify({ transactionId }) }),
}
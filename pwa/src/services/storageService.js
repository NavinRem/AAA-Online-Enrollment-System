import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/firebase'

/**
 * Upload a file to Firebase Storage and return its public download URL.
 *
 * @param {File} file - The file object to upload (e.g., payment receipt image).
 * @param {string} path - The storage path (e.g., `payment-proofs/enrollment_123.jpg`).
 * @returns {Promise<string>} The public download URL of the uploaded file.
 */
export async function uploadFile(file, path) {
  const fileRef = storageRef(storage, path)
  const snapshot = await uploadBytes(fileRef, file)
  const downloadURL = await getDownloadURL(snapshot.ref)
  return downloadURL
}

/**
 * Upload a payment receipt image for a specific enrollment.
 *
 * @param {File} file - The receipt image file.
 * @param {string} enrollmentId - The enrollment document ID.
 * @returns {Promise<string>} The download URL of the uploaded receipt.
 */
export async function uploadPaymentReceipt(file, enrollmentId) {
  const timestamp = Date.now()
  const extension = file.name?.split('.').pop() || 'jpg'
  const path = `payment-proofs/${enrollmentId}_${timestamp}.${extension}`
  return uploadFile(file, path)
}

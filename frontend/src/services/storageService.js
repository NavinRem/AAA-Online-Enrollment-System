import { storage } from '../firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

export const storageService = {
  // Upload Profile Image
  async uploadProfileImage(uid, file) {
    if (!file) return null

    // Validate if image
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image')
    }

    // Limit size (e.g., 2MB)
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('File size must be less than 2MB')
    }

    const storageRef = ref(storage, `users/${uid}/profile`)

    try {
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      return downloadURL
    } catch (error) {
      console.error('Upload failed', error)
      throw error
    }
  },
}

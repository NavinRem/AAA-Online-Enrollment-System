import { storage } from '@/firebase'
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  getBytes,
  getMetadata,
} from 'firebase/storage'

export const storageService = {
  async uploadFile(file, path) {
    if (!file) throw new Error('No file provided for upload')
    try {
      const storageRefObj = storageRef(storage, path)
      const snapshot = await uploadBytes(storageRefObj, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      console.log(`File uploaded successfully to: ${path}`)
      return downloadURL
    } catch (error) {
      console.error('Upload failed:', error)
      throw error
    }
  },

  async moveProfileImage(oldURL, newPath) {
    if (!oldURL || !oldURL.includes('/profiles/temp/')) return oldURL

    try {
      const oldRef = storageRef(storage, oldURL)
      const blob = await getBytes(oldRef)
      const metadata = await getMetadata(oldRef)
      const newRef = storageRef(storage, newPath)
      const snapshot = await uploadBytes(newRef, blob, {
        contentType: metadata.contentType || 'image/jpeg',
      })
      const newURL = await getDownloadURL(snapshot.ref)
      await deleteObject(oldRef)
      console.log(`Successfully moved profile image from temp to ${newPath}`)
      return newURL
    } catch (error) {
      console.error('Failed to move profile image:', error)
      return oldURL
    }
  },
}

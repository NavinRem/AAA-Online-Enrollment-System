import { storage } from '@/firebase'
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject, getBytes, getMetadata } from 'firebase/storage'

export const storageService = {
  /**
   * Moves a file from one path to another in Storage.
   * Useful for finalizing temporary uploads after a UID is obtained.
   * @param {string} oldURL - The full download URL of the existing file.
   * @param {string} newPath - The destination path (e.g. 'profiles/uid/name.jpg')
   * @returns {Promise<string>} - The new download URL.
   */
  async moveProfileImage(oldURL, newPath) {
    if (!oldURL || !oldURL.includes('/profiles/temp/')) return oldURL

    try {
      // 1. Get references
      const oldRef = storageRef(storage, oldURL)
      
      // 2. Download the existing bytes
      const blob = await getBytes(oldRef)
      const metadata = await getMetadata(oldRef)

      // 3. Upload to the new destination
      const newRef = storageRef(storage, newPath)
      const snapshot = await uploadBytes(newRef, blob, { 
        contentType: metadata.contentType || 'image/jpeg' 
      })
      
      const newURL = await getDownloadURL(snapshot.ref)

      // 4. Delete the old temporary file
      await deleteObject(oldRef)

      console.log(`Successfully moved profile image from temp to ${newPath}`)
      return newURL
    } catch (err) {
      console.error('Failed to move profile image:', err)
      return oldURL // Fallback to original URL if anything fails
    }
  }
}

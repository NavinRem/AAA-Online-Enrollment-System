import { storageService } from '@/services/storageService'
import { isSameProfileAsset } from './assetHelper'

/**
 * Manages the transition of profile images from the temporary bucket to the
 * teacher-specific production path. Ensures filenames are standardized and sanitized.
 * 
 * @param {string} profile - Incoming profile URL (potentially temporary)
 * @param {string} name - Entity name for filename generation
 * @param {string} currentProfile - Existing profile URL for comparison
 * @returns {Promise<string>} Stabilized profile URL
 */
export const processTeacherProfileImage = async (profile, name, currentProfile = '') => {
  if (!profile || !profile.includes('/profiles/temp/')) {
    return profile
  }
  if (currentProfile && isSameProfileAsset(profile, currentProfile)) {
    return currentProfile
  }

  try {
    const extension = profile.split('?')[0].split('.').pop() || 'jpg'
    const sanitizedName = (name || 'teacher')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
    const newPath = `profiles/teacher/${sanitizedName}_teacher.${extension}`

    return await storageService.moveProfileImage(profile, newPath)
  } catch (err) {
    console.warn('Failed to process teacher profile image, fallback to temp:', err)
    return profile
  }
}

/**
 * Prepares a clean, standardized payload for teacher registrations or updates.
 * Enforces the 'teacher' role and ensures 'active' status is the system default.
 * 
 * @param {Object} data - Form data
 * @returns {Object} Purified payload for the backend
 */
export const prepareTeacherPayload = (data) => {
  return {
    name: data.name?.trim(),
    email: data.email?.trim(),
    phone: data.phone?.trim(),
    role: 'teacher',
    profileURL: data.profileURL,
    status: (data.status || 'active').toLowerCase(),
  }
}

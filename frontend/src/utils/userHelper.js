import { storageService } from '@/services/storageService'
import { isSameProfileAsset } from './assetHelper'

/**
 * Handles profile image stabilization for users (parents/guardians).
 * Moves from temp to final destination if needed.
 */
export const processUserProfileImage = async (profile, name, role, currentProfile = '') => {
  if (!profile || !profile.includes('/profiles/temp/')) {
    return profile
  }
  if (currentProfile && isSameProfileAsset(profile, currentProfile)) {
    return currentProfile
  }

  try {
    const extension = profile.split('?')[0].split('.').pop() || 'jpg'
    const sanitizedName = (name || 'user')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
    const newPath = `profiles/parent/${sanitizedName}_${role}.${extension}`

    return await storageService.moveProfileImage(profile, newPath)
  } catch (err) {
    console.warn('Failed to process user profile image, fallback to temp:', err)
    return profile
  }
}

/**
 * Handles profile image stabilization for students.
 * Moves from temp to final destination if needed.
 */
export const processStudentProfileImage = async (profile, name, currentProfile = '') => {
  if (!profile || !profile.includes('/profiles/temp/')) {
    return profile
  }
  if (currentProfile && isSameProfileAsset(profile, currentProfile)) {
    return currentProfile
  }

  try {
    const extension = profile.split('?')[0].split('.').pop() || 'jpg'
    const sanitizedName = (name || 'student')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
    const newPath = `profiles/student/${sanitizedName}_student.${extension}`

    return await storageService.moveProfileImage(profile, newPath)
  } catch (err) {
    console.warn('Failed to process student profile image, fallback to temp:', err)
    return profile
  }
}

/**
 * Prepares a clean payload for user updates.
 */
export const prepareUserPayload = (data) => {
  return {
    name: data.name?.trim(),
    email: data.email?.trim(),
    phone: data.phone?.trim(),
    role: data.role || 'parent',
    profile: data.profile,
    status: data.status || 'Active',
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Prepares a clean payload for student registration/updates.
 */
export const prepareStudentPayload = (data) => {
  return {
    name: data.name?.trim(),
    dob: data.dob,
    profile: data.profile,
    medicalNote: data.medicalNote?.trim() || 'None',
    status: data.status || 'Studying',
    updatedAt: new Date().toISOString(),
  }
}


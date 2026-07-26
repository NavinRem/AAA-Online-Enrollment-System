import { getImageUrl } from '@/utils/assetHelper'

/**
 * Standardizes profile image URL resolution based on the user object or a raw string.
 * Generates semantic role-based fallbacks if a direct URL is missing.
 *
 * @param {Object|string} profile - The user profile record or a direct URL string
 * @returns {string} Fully qualified avatar URL or role-based fallback
 */
export const getAvatarUrl = (profile) => {
  if (!profile) return getImageUrl('profiles', 'avatar-guest')
  if (typeof profile === 'string') {
    if (profile.includes('avatar-admin') && !profile.includes('admin-')) {
      return getImageUrl('profiles', 'avatar-admin-female')
    }
    return profile
  }
  if (profile.profileURL) {
    if (profile.profileURL.includes('avatar-admin') && !profile.profileURL.includes('admin-')) {
      return getImageUrl('profiles', 'avatar-admin-female')
    }
    return profile.profileURL
  }

  const role = (profile.role?.toLowerCase() || 'guest').trim()
  if (role === 'admin') {
    return getImageUrl('profiles', 'avatar-admin-female')
  }
  try {
    const url = getImageUrl('profiles', `avatar-${role}`)
    return url || getImageUrl('profiles', 'avatar-guest')
  } catch (err) {
    console.error('Failed to get avatar URL:', err)
    return getImageUrl('profiles', 'avatar-guest')
  }
}

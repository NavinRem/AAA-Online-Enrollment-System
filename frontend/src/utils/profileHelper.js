import { getImageUrl } from '@/utils/assetHelper'

/**
 * Standardizes profile image URL resolution.
 * @param {object|string} profile - The user profile object or a direct URL string.
 */
export const getAvatarUrl = (profile) => {
  if (!profile) return getImageUrl('profiles', 'avatar-guest')
  if (typeof profile === 'string') return profile
  if (profile.profileURL) return profile.profileURL

  const role = (profile.role?.toLowerCase() || 'guest').trim()
  try {
    const url = getImageUrl('profiles', `avatar-${role}`)
    return url || getImageUrl('profiles', 'avatar-guest')
  } catch (e) {
    return getImageUrl('profiles', 'avatar-guest')
  }
}

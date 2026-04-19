import { request } from './api'

/**
 * Core User Service for shared, cross-role authentication and profile management.
 */
export const userService = {
  /**
   * Get a combined list of all users regardless of role.
   */
  getAllUsers() {
    return request('/users')
  },

  /**
   * Fetch a user profile by ID (Role-agnostic).
   */
  getProfile(uid) {
    return request(`/users/${uid}`)
  },

  /**
   * Initiate a manual password reset for a user.
   */
  resetPassword(uid) {
    return request(`/users/${uid}/reset-password`, {
      method: 'POST',
    })
  }
}

import { request } from './api'

export const parentService = {
  /**
   * Register a new parent account.
   */
  registerParent(data) {
    return request('/users/registerParentAccount', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Get all parents in the system (Admin Only).
   */
  getAllParents() {
    return request('/users/allParents')
  },

  /**
   * Update a parent profile or status.
   */
  updateParent(id, data) {
    return request(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  /**
   * Permanently delete a parent account.
   */
  deleteParent(id) {
    return request(`/users/${id}`, {
      method: 'DELETE',
    })
  },

  /**
   * Fetch a single parent profile (Role-agnostic but often used for parents).
   */
  getParent(id) {
    return request(`/users/${id}`)
  }
}

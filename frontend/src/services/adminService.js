import { request } from './api'

export const adminService = {
  /**
   * Register a new admin staff account.
   */
  registerAdmin(data) {
    return request('/users/registerStaffAccount', {
      method: 'POST',
      body: JSON.stringify({ ...data, role: 'admin' }),
    })
  },

  /**
   * Update an admin profile.
   */
  updateAdmin(id, data) {
    return request(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  /**
   * Delete an admin account.
   */
  deleteAdmin(id) {
    return request(`/users/${id}`, {
      method: 'DELETE',
    })
  }
}

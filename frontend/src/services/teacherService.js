import { request } from './api'

export const teacherService = {
  /**
   * Register a new teacher staff account.
   */
  registerTeacher(data) {
    return request('/users/registerStaffAccount', {
      method: 'POST',
      body: JSON.stringify({ ...data, role: 'teacher' }),
    })
  },

  /**
   * Update a teacher profile.
   */
  updateTeacher(id, data) {
    return request(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  /**
   * Delete a teacher account.
   */
  deleteTeacher(id) {
    return request(`/users/${id}`, {
      method: 'DELETE',
    })
  }
}

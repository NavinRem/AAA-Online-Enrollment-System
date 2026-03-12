import { request } from './api'

export const enrollmentService = {
  // Create Enrollment
  createEnrollment(data) {
    return request('/enrollments/createEnrollment', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },


  // Cancel Enrollment
  cancelEnrollment(enrollmentId) {
    return request(`/enrollments/${enrollmentId}/cancel`, {
      method: 'POST',
    })
  },

  // Update Enrollment
  updateEnrollment(enrollmentId, data) {
    return request(`/enrollments/${enrollmentId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  // Delete Enrollment permanently
  deleteEnrollment(enrollmentId) {
    return request(`/enrollments/${enrollmentId}`, {
      method: 'DELETE',
    })
  },

  // Get all enrollments
  getAllEnrollments() {
    return request('/enrollments')
  },

  // Get a single enrollment
  getEnrollment(id) {
    return request(`/enrollments/${id}`)
  },
}

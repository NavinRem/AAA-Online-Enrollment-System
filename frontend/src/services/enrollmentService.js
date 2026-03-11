import { request } from './api'

export const enrollmentService = {
  // Create Enrollment
  createEnrollment(data) {
    return request('/enrollments/createEnrollment', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Legacy alias/shorthand
  create(data) {
    return this.createEnrollment(data)
  },

  // Cancel Enrollment
  cancelEnrollment(enrollmentId) {
    return request('/enrollments/cancel', {
      method: 'POST',
      body: JSON.stringify({ enrollment_id: enrollmentId }),
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
  getAll() {
    return request('/enrollments', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  },

  // Get a single enrollment
  get(id) {
    return request(`/enrollments/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  },
}

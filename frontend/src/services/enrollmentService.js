import { request } from './api'

export const enrollmentService = {
  createEnrollment(data) {
    return request('/enrollments/createEnrollment', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  cancelEnrollment(enrollmentId) {
    return request(`/enrollments/${enrollmentId}/cancel`, {
      method: 'POST',
    })
  },

  updateEnrollment(enrollmentId, data) {
    return request(`/enrollments/${enrollmentId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  deleteEnrollment(enrollmentId) {
    return request(`/enrollments/${enrollmentId}`, {
      method: 'DELETE',
    })
  },

  getAllEnrollments() {
    return request('/enrollments')
  },

  getEnrollment(id) {
    return request(`/enrollments/${id}`)
  },
}

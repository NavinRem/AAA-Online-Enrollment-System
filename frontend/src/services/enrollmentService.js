import { request } from './api'

export const enrollmentService = {
  createEnrollment(data) {
    return request('/enrollments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getAllEnrollments() {
    return request('/enrollments', {
      method: 'GET',
    })
  },

  getEnrollment(id) {
    return request(`/enrollments/${id}`, {
      method: 'GET',
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

  cancelEnrollment(enrollmentId) {
    return request(`/enrollments/${enrollmentId}/cancel`, {
      method: 'POST',
    })
  },
}

export default enrollmentService

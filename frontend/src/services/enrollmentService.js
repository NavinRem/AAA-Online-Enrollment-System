import { request } from './api'

export const enrollmentService = {
  createEnrollment(data) {
    return request('/enrollments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getAllEnrollments(params = {}, options = {}) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== 'undefined')
    )
    const searchParams = new URLSearchParams(cleanParams).toString()
    const url = searchParams ? `/enrollments?${searchParams}` : '/enrollments'
    return request(url, {
      method: 'GET',
      ...options
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

  processPayment(enrollmentId, paymentData) {
    return request(`/enrollments/${enrollmentId}/process-payment`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    })
  },
}

export default enrollmentService

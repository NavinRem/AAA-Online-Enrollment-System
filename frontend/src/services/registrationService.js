import { request } from './api'

export const registrationService = {
  // Create Enrollment
  createEnrollment(data) {
    return request('/registrations/createEnrollment', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Legacy alias
  create(data) {
    return this.createEnrollment(data)
  },

  // Cancel Enrollment
  cancelEnrollment(enrollmentId) {
    return request('/registrations/cancel', {
      method: 'POST',
      body: JSON.stringify({ enrollment_id: enrollmentId }),
    })
  },

  // Update Enrollment
  updateEnrollment(enrollmentId, data) {
    return request(`/registrations/${enrollmentId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  // Delete Enrollment permanently
  deleteEnrollment(enrollmentId) {
    return request(`/registrations/${enrollmentId}`, {
      method: 'DELETE',
    })
  },

  // Get all registrations
  getAll() {
    return request('/registrations', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  },

  // Get a single registration
  get(id) {
    return request(`/registrations/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  },
}

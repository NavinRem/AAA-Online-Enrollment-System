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

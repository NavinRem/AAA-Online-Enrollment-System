import { request } from './api'

export const registrationService = {
  // Create a new registration
  create(data) {
    return request('/registrations', {
      method: 'POST',
      body: JSON.stringify(data),
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

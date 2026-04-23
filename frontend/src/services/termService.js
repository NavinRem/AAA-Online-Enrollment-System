import { request } from './api'

export const termService = {
  createTerm(data) {
    return request('/terms', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getAllTerms() {
    return request('/terms', {
      method: 'GET',
    })
  },

  getTerm(id) {
    return request(`/terms/${id}`, {
      method: 'GET',
    })
  },

  updateTerm(id, data) {
    return request(`/terms/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  deleteTerm(id) {
    return request(`/terms/${id}`, {
      method: 'DELETE',
    })
  },
}

export default termService

import { request } from './api'

export const termService = {
  createTerm(data) {
    return request('/terms', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getAllTerms() {
    return request('/terms')
  },

  getTerm(id) {
    return request(`/terms/${id}`)
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

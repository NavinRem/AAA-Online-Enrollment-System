import { request } from './api'

export const parentService = {
  getAllParents() {
    return request('/parents', {
      method: 'GET',
    })
  },

  getParent(id) {
    return request(`/parents/${id}`)
  },

  createParent(data) {
    return request('/parents', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  updateParent(id, data) {
    return request(`/parents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  deleteParent(id) {
    return request(`/parents/${id}`, {
      method: 'DELETE',
    })
  },
}

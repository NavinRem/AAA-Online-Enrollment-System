import { request } from './api'

export const parentService = {
  getAllParents() {
    return request('/parents')
  },

  getParent(id) {
    return request(`/parents/${id}`)
  },

  registerParent(data) {
    return request('/parents/register', {
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

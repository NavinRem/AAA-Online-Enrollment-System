import { request } from './api'

const parentService = {
  createParent(data) {
    return request('/parents', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getAllParents() {
    return request('/parents', {
      method: 'GET',
    })
  },

  getParent(uid) {
    return request(`/parents/${uid}`, {
      method: 'GET',
    })
  },

  updateParent(uid, data) {
    return request(`/parents/${uid}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  deleteParent(uid) {
    return request(`/parents/${uid}`, {
      method: 'DELETE',
    })
  },
}

export { parentService }

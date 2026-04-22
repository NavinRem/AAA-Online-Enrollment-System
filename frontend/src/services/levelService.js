import { request } from './api'

export const levelService = {
  createLevel(data) {
    return request('/levels', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getAllLevels(filters = {}) {
    const params = new URLSearchParams(filters).toString()
    const query = params ? `?${params}` : ''
    return request(`/levels${query}`)
  },

  getLevel(id) {
    return request(`/levels/${id}`)
  },

  updateLevel(id, data) {
    return request(`/levels/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  deleteLevel(id) {
    return request(`/levels/${id}`, {
      method: 'DELETE',
    })
  },
}

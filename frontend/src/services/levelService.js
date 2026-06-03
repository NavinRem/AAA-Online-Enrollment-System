import { request } from './api'

export const levelService = {
  createLevel(data) {
    return request('/levels', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getAllLevels(options = {}) {
    const params = new URLSearchParams(options.filters || {}).toString()
    const query = params ? `?${params}` : ''
    return request(`/levels${query}`, {
      method: 'GET',
      ...options,
    })
  },

  getLevel(id) {
    return request(`/levels/${id}`, {
      method: 'GET',
    })
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

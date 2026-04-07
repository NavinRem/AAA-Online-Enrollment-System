import { request } from './api'

export const programService = {
  getAllPrograms() {
    return request('/programs')
  },

  getSessions(programId, branchId = null) {
    const url = `/programs/${programId}/sessions${branchId ? `?branchId=${branchId}` : ''}`
    return request(url)
  },

  getAllSessions() {
    return request('/sessions')
  },

  getProgram(programId) {
    return request(`/programs/${programId}`)
  },

  createProgram(data) {
    return request('/programs', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  updateProgram(id, data) {
    return request(`/programs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  deleteProgram(id) {
    return request(`/programs/${id}`, {
      method: 'DELETE',
    })
  },

  getAllCategories() {
    return request('/categories')
  },

  createCategory(data) {
    return request('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  deleteCategory(id) {
    return request(`/categories/${id}`, {
      method: 'DELETE',
    })
  },

  getAllLevels(categoryId) {
    if (!categoryId) return Promise.resolve([])
    return request(`/categories/${categoryId}/levels`)
  },

  createLevel(categoryId, data) {
    return request(`/categories/${categoryId}/levels`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getAllTerms() {
    return request('/terms')
  },

  createTerm(data) {
    return request('/terms', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async uploadImage(file) {
    const formData = new FormData()
    formData.append('image', file)
    return request('/uploads', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': undefined,
      },
    })
  },

  createSession(data) {
    return request('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  syncAllSessions() {
    return request('/sessions/sync-all', {
      method: 'POST',
    })
  },
}

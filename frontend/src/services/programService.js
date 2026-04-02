import { request } from './api'

export const programService = {
  // Get all programs
  getAllPrograms() {
    return request('/programs')
  },

  // Get sessions for a specific program
  getSessions(programId) {
    return request(`/programs/${programId}/sessions`)
  },

  // Get all sessions across all programs
  getAllSessions() {
    return request('/sessions')
  },

  // Get single program details
  getProgram(programId) {
    return request(`/programs/${programId}`)
  },

  // Create new program
  createProgram(data) {
    return request('/programs', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Update existing program
  updateProgram(id, data) {
    return request(`/programs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  // Delete program
  deleteProgram(id) {
    return request(`/programs/${id}`, {
      method: 'DELETE',
    })
  },

  // CATEGORY MANAGEMENT
  getAllCategories() {
    return request('/categories')
  },

  async createCategory(data) {
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

  // LEVEL MANAGEMENT (Category-Specific)
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

  // TERM MANAGEMENT
  getAllTerms() {
    return request('/terms')
  },

  createTerm(data) {
    return request('/terms', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // UPLOAD
  async uploadImage(file) {
    const formData = new FormData()
    formData.append('image', file)

    // Note: request helper needs to handle lack of JSON content-type for FormData
    // We'll use fetch directly or fix request
    return request('/uploads', {
      method: 'POST',
      body: formData,
      headers: {
        // Let the browser set the boundary
        'Content-Type': undefined,
      },
    })
  },
  // SESSION MANAGEMENT
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

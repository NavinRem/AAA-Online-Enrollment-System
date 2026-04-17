import { request } from './api'

export const programService = {
  getAllPrograms() {
    return request('/programs')
  },

  getClasses(programId) {
    return request(`/classes?programId=${programId}`)
  },

  getAllClasses() {
    return request('/classes')
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

  getAllLevels() {
    return request('/levels')
  },

  createLevel(data) {
    return request('/levels', {
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

  // --- Classes (Operational Instances) ---
  createClass(data) {
    return request('/classes', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  updateClass(id, data) {
    return request(`/classes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  deleteClass(id) {
    return request(`/classes/${id}`, {
      method: 'DELETE',
    })
  },

  duplicateClasses(data) {
    return request('/classes/duplicate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  syncAllClasses() {
    // This would be the updated version of syncAllSessions
    return request('/classes/sync-all', {
      method: 'POST',
    })
  },
}

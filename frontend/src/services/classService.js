import { request } from './api'

export const classService = {
  createClass(data) {
    return request('/classes', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getAllClasses(filters = {}) {
    const params = new URLSearchParams(filters).toString()
    const query = params ? `?${params}` : ''
    return request(`/classes${query}`, {
      method: 'GET',
    })
  },

  getClass(id) {
    return request(`/classes/${id}`, {
      method: 'GET',
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

  // --- Specialized Actions ---

  getAvailableClasses(programId, branchId = null) {
    const query = branchId ? `?branchId=${branchId}` : ''
    return request(`/programs/${programId}/classes${query}`)
  },

  duplicateClasses(data) {
    return request('/classes/duplicate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  duplicateSpecificClasses(classIds, targetTermId) {
    return request('/classes/duplicate-selective', {
      method: 'POST',
      body: JSON.stringify({ classIds, targetTermId }),
    })
  },

  syncClassCount(id) {
    return request(`/classes/${id}/sync`, { method: 'POST' })
  },

  syncAllClassCounts() {
    return request('/classes/sync-all', { method: 'POST' })
  },

  validateCapacity(id) {
    return request(`/classes/${id}/validate-capacity`)
  },
}

import { request } from './api'

export const categoryService = {
  createCategory(data) {
    return request('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getAllCategories(options = {}) {
    return request('/categories', {
      method: 'GET',
      ...options,
    })
  },

  getCategory(id) {
    return request(`/categories/${id}`, {
      method: 'GET',
    })
  },

  updateCategory(id, data) {
    return request(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  deleteCategory(id) {
    return request(`/categories/${id}`, {
      method: 'DELETE',
    })
  },
}

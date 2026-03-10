import { request } from './api'

export const courseService = {
  // Get all courses
  async getAllCourses() {
    return request('/courses', {
      method: 'GET',
    })
  },

  // Get sessions for a specific course
  async getSessions(courseId) {
    return request(`/courses/${courseId}/sessions`, {
      method: 'GET',
    })
  },

  // Get all sessions across all courses
  async getAllSessions() {
    return request('/sessions', {
      method: 'GET',
    })
  },

  // Get single course details
  async getCourse(courseId) {
    return request(`/courses/${courseId}`, {
      method: 'GET',
    })
  },

  // Create new course
  async createCourse(data) {
    return request('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Update existing course
  async updateCourse(id, data) {
    return request(`/courses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  // Delete course
  async deleteCourse(id) {
    return request(`/courses/${id}`, {
      method: 'DELETE',
    })
  },

  // CATEGORY MANAGEMENT
  async getAllCategories() {
    return request('/categories', {
      method: 'GET',
    })
  },

  async createCategory(data) {
    return request('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async deleteCategory(id) {
    return request(`/categories/${id}`, {
      method: 'DELETE',
    })
  },

  // LEVEL MANAGEMENT (Category-Specific)
  async getAllLevels(categoryId) {
    if (!categoryId) return []
    return request(`/categories/${categoryId}/levels`, {
      method: 'GET',
    })
  },

  async createLevel(categoryId, data) {
    return request(`/categories/${categoryId}/levels`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // TERM MANAGEMENT
  async getAllTerms() {
    return request('/terms', {
      method: 'GET',
    })
  },

  async createTerm(data) {
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
}

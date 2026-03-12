import { request } from './api'

export const courseService = {
  // Get all courses
  getAllCourses() {
    return request('/courses')
  },

  // Get sessions for a specific course
  getSessions(courseId) {
    return request(`/courses/${courseId}/sessions`)
  },

  // Get all sessions across all courses
  getAllSessions() {
    return request('/sessions')
  },

  // Get single course details
  getCourse(courseId) {
    return request(`/courses/${courseId}`)
  },

  // Create new course
  createCourse(data) {
    return request('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Update existing course
  updateCourse(id, data) {
    return request(`/courses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  // Delete course
  deleteCourse(id) {
    return request(`/courses/${id}`, {
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
}

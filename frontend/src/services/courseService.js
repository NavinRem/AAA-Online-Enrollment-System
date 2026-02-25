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

  // Get single course details
  async getCourse(courseId) {
    return request(`/courses/${courseId}`, {
      method: 'GET',
    })
  },
}

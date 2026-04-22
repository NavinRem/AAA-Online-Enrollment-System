import { request } from './api'

export const teacherService = {
  createTeacher(data) {
    return request('/teachers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getAllTeachers() {
    return request('/teachers')
  },

  getTeacher(id) {
    return request(`/teachers/${id}`)
  },

  updateTeacher(id, data) {
    return request(`/teachers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  deleteTeacher(id) {
    return request(`/teachers/${id}`, {
      method: 'DELETE',
    })
  },
}

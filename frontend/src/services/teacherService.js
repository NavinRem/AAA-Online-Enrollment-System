import { request } from './api'

export const teacherService = {
  getAllTeachers() {
    return request('/teachers')
  },

  getTeacher(id) {
    return request(`/teachers/${id}`)
  },

  createTeacher(data) {
    return request('/teachers/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
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

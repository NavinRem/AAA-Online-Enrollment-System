import { request } from './api'

export const studentService = {
  createStudent(studentData, userId) {
    return request('/students', {
      method: 'POST',
      body: JSON.stringify({
        ...studentData,
        userId,
      }),
    })
  },

  getAllStudents() {
    return request('/students', {
      method: 'GET',
    })
  },

  getStudent(id) {
    return request(`/students/${id}`, {
      method: 'GET',
    })
  },

  updateStudent(id, data) {
    return request(`/students/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  deleteStudent(id) {
    return request(`/students/${id}`, {
      method: 'DELETE',
    })
  },

  getStudentsByParent(parentId) {
    return request(`/students/parent/${parentId}`, {
      method: 'GET',
    })
  },
}

export default studentService

import { request } from './api'

export const studentService = {
  createStudent(studentData) {
    return request('/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    })
  },

  getAllStudents() {
    return request('/students')
  },

  getStudent(id) {
    return request(`/students/${id}`)
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
    return request(`/students/parent/${parentId}`)
  },
}

export default studentService

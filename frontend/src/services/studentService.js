import { request } from './api'

export const studentService = {
  getAllStudents() {
    return request('/students')
  },

  getStudent(id) {
    return request(`/students/${id}`)
  },

  registerStudent(parentId, studentData) {
    return request('/students', {
      method: 'POST',
      body: JSON.stringify({ ...studentData, parentId }),
    })
  },

  updateStudent(id, data) {
    return request(`/students/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  getStudentsByParent(parentId) {
    return request(`/students/parent/${parentId}`)
  },

  deleteStudent(id) {
    return request(`/students/${id}`, {
      method: 'DELETE',
    })
  },

  getStudents() {
    return this.getAllStudents()
  },
}

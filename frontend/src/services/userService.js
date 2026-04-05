import { request } from './api'

export const userService = {
  registerParentAccount(userData) {
    return request('/users/registerParentAccount', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  },

  getProfile(uid) {
    return request(`/users/${uid}`)
  },

  getAllUsers() {
    return request('/users')
  },

  registerStudentProfile(uid, studentData) {
    return request(`/users/${uid}/registerStudentProfile`, {
      method: 'POST',
      body: JSON.stringify(studentData),
    })
  },

  updateMedicalInfo(studentId, note) {
    return request(`/users/students/${studentId}/medical`, {
      method: 'PATCH',
      body: JSON.stringify({ medicalNote: note }),
    })
  },

  updateStudent(studentId, updateData) {
    return request(`/students/${studentId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    })
  },

  getStudent(studentId) {
    return request(`/students/${studentId}`)
  },

  getStudentsByParentID(uid) {
    return request(`/users/${uid}/students`)
  },

  getAllStudents() {
    return request('/users/allStudents')
  },

  updateUser(uid, updateData) {
    return request(`/users/${uid}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    })
  },

  deleteUser(uid) {
    return request(`/users/${uid}`, {
      method: 'DELETE',
    })
  },

  deleteStudent(studentId) {
    return request(`/students/${studentId}`, {
      method: 'DELETE',
    })
  },
}

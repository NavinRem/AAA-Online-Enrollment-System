import { request } from './api'

export const userService = {
  // Register Parent Account
  async registerParentAccount(userData) {
    return request('/users/registerParentAccount', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  },

  // Get User Profile by UID
  getProfile(uid) {
    return request(`/users/${uid}`)
  },

  // Get User Role
  async getUserRole(uid) {
    return request(`/users/${uid}/role`, {
      method: 'GET',
    })
  },

  // Get All Users (Admin primarily)
  getAllUsers() {
    return request('/users')
  },

  // Register Student Profile
  async registerStudentProfile(uid, studentData) {
    return request(`/users/${uid}/registerStudentProfile`, {
      method: 'POST',
      body: JSON.stringify(studentData),
    })
  },

  // Update Medical Info
  async updateMedicalInfo(studentId, note) {
    return request(`/users/students/${studentId}/medical`, {
      method: 'PUT',
      body: JSON.stringify({ medical_note: note }),
    })
  },

  // Update Student Profile Details or Status
  async updateStudent(studentId, updateData) {
    return request(`/students/${studentId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    })
  },

  // Get Individual Student
  getStudent(studentId) {
    return request(`/students/${studentId}`)
  },

  // Get Students by Parent
  getStudents(uid) {
    return request(`/users/${uid}/students`)
  },

  // Get All Students (Admin)
  getAllStudents() {
    return request('/users/allStudents')
  },

  // Update User Profile (Admin)
  async updateUser(uid, updateData) {
    return request(`/users/${uid}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    })
  },

  // Delete User Account (Admin)
  async deleteUser(uid) {
    return request(`/users/${uid}`, {
      method: 'DELETE',
    })
  },

}

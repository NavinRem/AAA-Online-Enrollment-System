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
  async getProfile(uid) {
    return request(`/users/${uid}`, {
      method: 'GET',
    })
  },

  // Get User Role
  async getUserRole(uid) {
    return request(`/users/${uid}/role`, {
      method: 'GET',
    })
  },

  // Get All Users (Admin primarily)
  async getAllUsers() {
    return request('/users', {
      method: 'GET',
    })
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

  // Get Students
  async getStudents(uid) {
    return request(`/users/${uid}/students`, {
      method: 'GET',
    })
  },

  // Aliases for backward compatibility in components
  async createUser(userData) {
    return this.registerParentAccount(userData)
  },
  async addStudent(uid, data) {
    return this.registerStudentProfile(uid, data)
  },
}

import { request } from './api'

export const studentService = {
  /**
   * Register a new student profile for a parent.
   */
  registerStudent(parentId, studentData) {
    return request(`/users/${parentId}/registerStudentProfile`, {
      method: 'POST',
      body: JSON.stringify(studentData),
    })
  },

  /**
   * Get all students in the system (Admin Only).
   */
  getAllStudents() {
    return request('/users/allStudents')
  },

  /**
   * Get a specific student by ID.
   */
  getStudent(id) {
    return request(`/students/${id}`)
  },

  /**
   * Update student general information.
   */
  updateStudent(id, data) {
    return request(`/students/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  /**
   * Update specialized medical information for a student.
   */
  updateMedicalInfo(id, note) {
    return request(`/users/students/${id}/medical`, {
      method: 'PATCH',
      body: JSON.stringify({ medicalNote: note }),
    })
  },

  /**
   * Fetch all students linked to a specific parent.
   */
  getStudentsByParent(parentId) {
    return request(`/users/${parentId}/students`)
  },

  /**
   * Permanently delete a student record.
   */
  deleteStudent(id) {
    return request(`/students/${id}`, {
      method: 'DELETE',
    })
  },

  /**
   * Legacy alias for getAllStudents if needed for compatibility during migration.
   */
  getStudents() {
    return this.getAllStudents()
  }
}

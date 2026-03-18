import { request } from './api'

export const trackingService = {
  // Get attendance history for a student
  getAttendanceHistory(studentId) {
    return request(`/attendance/student/${studentId}`)
  },

  // Get student progress
  getStudentProgress(studentId) {
    return request(`/progress/${studentId}`)
  }
}

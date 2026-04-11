import { request } from './api'

/**
 * Service for tracking student academic progress, attendance, and behavior.
 * This service mediates between the frontend dashboards and the tracking endpoints.
 */
export const trackingService = {
  /**
   * Fetches the official attendance history for a specific student.
   * @param {string} studentId
   * @returns {Promise<Array>}
   */
  getAttendanceHistory(studentId) {
    return request(`/students/${studentId}/attendance`).catch((err) => {
      console.warn(
        `[TrackingService] Attendance history unavailable for student ${studentId}:`,
        err.message,
      )
      return []
    })
  },

  /**
   * Fetches comprehensive progress data including behavior logs and exam records.
   * @param {string} studentId
   * @returns {Promise<Object>}
   */
  getStudentProgress(studentId) {
    return request(`/students/${studentId}/progress`).catch((err) => {
      console.warn(
        `[TrackingService] Progress metrics unavailable for student ${studentId}:`,
        err.message,
      )
      return {
        behaviorLogs: [],
        examRecords: [],
        overallProgress: 'Good',
      }
    })
  },
}

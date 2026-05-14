import { request } from './api'

export const attendanceService = {
  /**
   * Fetches all attendance records for a class.
   * @param {string} classId
   */
  getClassAttendance(classId) {
    return request(`/attendance/${classId}`)
  },

  /**
   * Records attendance for a specific session.
   * @param {string} classId
   * @param {number} sessionId
   * @param {Object} statuses
   */
  recordAttendance(classId, sessionId, statuses) {
    return request('/attendance/record', {
      method: 'POST',
      body: JSON.stringify({ classId, sessionId, statuses }),
    })
  },
}

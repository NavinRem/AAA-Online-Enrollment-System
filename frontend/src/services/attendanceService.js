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
   * @param {number|string} sessionId
   * @param {Object} statuses
   * @param {string} termId
   * @param {string} scheduleId
   */
  recordAttendance(classId, sessionId, statuses, termId, scheduleId) {
    return request('/attendance/record', {
      method: 'POST',
      body: JSON.stringify({ classId, sessionId, statuses, termId, scheduleId }),
    })
  },
}

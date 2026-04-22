/**
 * Service for tracking student academic progress, attendance, and behavior.
 * MOCKED: This service currently returns placeholder data to avoid out-of-scope backend requests.
 */
export const trackingService = {
  /**
   * Returns a placeholder attendance history.
   * @param {string} studentId
   * @returns {Promise<Array>}
   */
  async getAttendanceHistory() {
    // Return empty array locally to satisfy UI requirements without backend 404s
    return []
  },

  /**
   * Returns placeholder progress metrics.
   * @param {string} studentId
   * @returns {Promise<Object>}
   */
  async getStudentProgress() {
    // Return default structure locally to avoid backend 404s
    return {
      behaviorLogs: [],
      examRecords: [],
      overallProgress: '',
    }
  },
}

export default trackingService

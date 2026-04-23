export const trackingService = {
  async getAttendanceHistory() {
    return []
  },

  async getStudentProgress() {
    return {
      behaviorLogs: [],
      examRecords: [],
      overallProgress: '',
    }
  },
}

export default trackingService

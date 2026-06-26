const trackingService = {
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

export { trackingService }

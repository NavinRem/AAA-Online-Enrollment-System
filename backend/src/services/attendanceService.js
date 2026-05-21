const { db, COLLECTIONS } = require('../config/database')

class AttendanceService {
  /**
   * Records attendance for a specific session of a class.
   * @param {string} classId
   * @param {number} sessionId - The session number (1, 2, 3...)
   * @param {Object} studentStatuses - Map of studentId to status ('P', 'A', 'L', 'N')
   */
  async recordAttendance(classId, sessionId, studentStatuses) {
    if (!classId || !sessionId)
      throw new Error('Class ID and Session ID are required')

    const attendanceId = `${classId}_${sessionId}`
    const attendanceRef = db
      .collection(COLLECTIONS.ATTENDANCE || 'attendances')
      .doc(attendanceId)

    const data = {
      classId,
      sessionId,
      statuses: studentStatuses,
      updatedAt: new Date().toISOString(),
    }

    await attendanceRef.set(data, { merge: true })
    return { id: attendanceId, ...data }
  }

  /**
   * Fetches all attendance records for a specific class.
   * @param {string} classId
   */
  async getClassAttendance(classId) {
    if (!classId) throw new Error('Class ID is required')

    const snapshot = await db
      .collection(COLLECTIONS.ATTENDANCE || 'attendances')
      .where('classId', '==', classId)
      .get()

    const attendanceMap = {}
    snapshot.forEach((doc) => {
      const data = doc.data()
      attendanceMap[data.sessionId] = data.statuses
    })

    return attendanceMap
  }
}

module.exports = new AttendanceService()

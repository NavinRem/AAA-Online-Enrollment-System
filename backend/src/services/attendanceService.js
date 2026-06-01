const { db, COLLECTIONS } = require('../config/database')
const admin = require('firebase-admin')

class AttendanceService {
  /**
   * Records attendance for a specific session of a class.
   * @param {string} classId
   * @param {number|string} sessionId - The session number or ID
   * @param {Object} studentStatuses - Map of studentId to status ('P', 'A', 'L', 'N', 'M')
   * @param {string} termId - The term ID to associate the attendance record
   */
  async recordAttendance(classId, sessionId, studentStatuses, termId) {
    if (!classId || !sessionId)
      throw new Error('Class ID and Session ID are required')
    if (!termId)
      throw new Error('Term ID is required')

    const batch = db.batch()
    const updatedAt = new Date().toISOString()
    const resultList = []

    for (const [studentId, status] of Object.entries(studentStatuses)) {
      const docId = `${classId}_${sessionId}_${studentId}`
      const ref = db
        .collection(COLLECTIONS.ATTENDANCE || 'attendances')
        .doc(docId)
        
      const data = {
        classId,
        termId,
        sessionId,
        studentId,
        status,
        updatedAt,
        history: admin.firestore.FieldValue.arrayUnion({
          status,
          changedAt: updatedAt
        })
      }
      
      batch.set(ref, data, { merge: true })
      resultList.push({ id: docId, ...data })
    }

    await batch.commit()
    return resultList
  }

  /**
   * Fetches all attendance records for a specific class.
   * Rebuilds the legacy structure `{ sessionId: { studentId: status } }` for frontend compatibility.
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
      // Support legacy format if it exists, alongside new format
      if (data.statuses) {
        attendanceMap[data.sessionId] = {
           ...(attendanceMap[data.sessionId] || {}),
           ...data.statuses
        }
      } else if (data.studentId && data.status) {
        if (!attendanceMap[data.sessionId]) {
          attendanceMap[data.sessionId] = {}
        }
        attendanceMap[data.sessionId][data.studentId] = data.status
      }
    })

    return attendanceMap
  }
}

module.exports = new AttendanceService()

const { db, COLLECTIONS } = require('../config/database')

const { FieldValue } = require('firebase-admin/firestore')

class AttendanceService {
  /**
   * Resolves the scheduleId for a given class, student, and term.
   */
  async _resolveScheduleId(classId, studentId, termId) {
    // 1. Try to find from enrollments
    const enrollmentsSnap = await db
      .collection(COLLECTIONS.ENROLLMENT || 'enrollments')
      .where('studentId', '==', studentId)
      .where('classId', '==', classId)
      .where('termId', '==', termId)
      .where('isDeleted', '==', false)
      .limit(1)
      .get()

    if (!enrollmentsSnap.empty) {
      const data = enrollmentsSnap.docs[0].data()
      const schedId = data.scheduleId || data.class?.schedule?.id
      if (schedId) return schedId
    }

    // 2. Fallback: get the first schedule from the class document
    const classDoc = await db
      .collection(COLLECTIONS.CLASS || 'classes')
      .doc(classId)
      .get()

    if (classDoc.exists) {
      const classData = classDoc.data()
      if (classData.schedules && classData.schedules.length > 0) {
        return classData.schedules[0].id
      }
      if (classData.scheduleIds && classData.scheduleIds.length > 0) {
        return classData.scheduleIds[0]
      }
    }

    // 3. Last resort fallback
    return 'default'
  }

  /**
   * Records attendance for a specific session of a class.
   * @param {string} classId
   * @param {number|string} sessionId - The session number or ID
   * @param {Object} studentStatuses - Map of studentId to status ('P', 'A', 'L', 'N', 'M')
   * @param {string} termId - The term ID to associate the attendance record
   * @param {string} [scheduleId] - The optional schedule ID
   */
  async recordAttendance(classId, sessionId, studentStatuses, termId, scheduleId) {
    if (!classId || !sessionId)
      throw new Error('Class ID and Session ID are required')
    if (!termId)
      throw new Error('Term ID is required')

    const batch = db.batch()
    const updatedAt = new Date().toISOString()
    const resultList = []

    for (const [studentId, status] of Object.entries(studentStatuses)) {
      let resolvedScheduleId = scheduleId
      if (!resolvedScheduleId) {
        resolvedScheduleId = await this._resolveScheduleId(classId, studentId, termId)
      }

      const docId = `${sessionId}_${studentId}`
      const ref = db
        .collection(COLLECTIONS.TERM || 'terms')
        .doc(termId)
        .collection(COLLECTIONS.CLASS || 'classes')
        .doc(classId)
        .collection(COLLECTIONS.SCHEDULE || 'schedules')
        .doc(resolvedScheduleId)
        .collection('attendance')
        .doc(docId)
        
      const data = {
        classId,
        termId,
        scheduleId: resolvedScheduleId,
        sessionId,
        studentId,
        status,
        updatedAt,
        history: FieldValue.arrayUnion({
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
      .collectionGroup('attendance')
      .where('classId', '==', classId)
      .get()

    const attendanceMap = {}
    snapshot.forEach((doc) => {
      const data = doc.data()
      
      // Skip legacy documents that lack a scheduleId
      if (!data.scheduleId) return

      // Support format if it exists, alongside new format
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

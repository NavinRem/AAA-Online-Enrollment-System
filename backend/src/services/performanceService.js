const { db, COLLECTIONS } = require('../config/database')

class PerformanceService {
  /**
   * Creates an academic performance evaluation record.
   * @param {Object} data
   * @param {Object} requestingUser
   */
  async createPerformance(data, requestingUser = null) {
    const {
      studentId,
      classId,
      termId,
      skillsMastered,
      overallGrade,
      teacherRemarks,
    } = data

    if (!studentId || !classId || !termId) {
      throw new Error('Student ID, Class ID, and Term ID are required')
    }

    // Verify student exists and get parentId
    const studentDoc = await db
      .collection(COLLECTIONS.STUDENT)
      .doc(studentId)
      .get()
    if (!studentDoc.exists) throw new Error('Student not found')
    const studentData = studentDoc.data()
    const parentId = studentData.parentId

    // Verify class exists
    const classDoc = await db.collection(COLLECTIONS.CLASS).doc(classId).get()
    if (!classDoc.exists) throw new Error('Class not found')

    // Verify term exists
    const termDoc = await db.collection(COLLECTIONS.TERM).doc(termId).get()
    if (!termDoc.exists) throw new Error('Term not found')

    const performanceId = db.collection('academic_performances').doc().id
    const now = new Date().toISOString()

    const performanceRecord = {
      studentId,
      parentId,
      classId,
      termId,
      studentName: studentData.name,
      className: classDoc.data().program?.name || 'Class',
      termName: termDoc.data().name || 'Term',
      skillsMastered: skillsMastered || [],
      overallGrade: overallGrade || 'Satisfactory',
      teacherRemarks: teacherRemarks || '',
      evaluationDate: data.evaluationDate || now,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    }

    await db
      .collection('academic_performances')
      .doc(performanceId)
      .set(performanceRecord)
    return { id: performanceId, ...performanceRecord }
  }

  /**
   * Retrieves all academic performance records for a student with security checks.
   * @param {string} studentId
   * @param {Object} requestingUser
   */
  async getPerformanceByStudent(studentId, requestingUser = null) {
    if (!studentId) throw new Error('Student ID is required')

    const studentDoc = await db
      .collection(COLLECTIONS.STUDENT)
      .doc(studentId)
      .get()
    if (!studentDoc.exists) throw new Error('Student not found')
    const studentData = studentDoc.data()

    // Security check: Only Admins, Teachers, or the Parent of the child can view
    if (
      requestingUser &&
      requestingUser.role !== 'admin' &&
      requestingUser.role !== 'teacher' &&
      requestingUser.uid !== studentData.parentId
    ) {
      throw new Error(
        'Access Denied: You do not have permission to view this academic performance.',
      )
    }

    const snapshot = await db
      .collection('academic_performances')
      .where('studentId', '==', studentId)
      .where('isDeleted', '==', false)
      .get()

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  }

  /**
   * Retrieves a single academic performance evaluation.
   * @param {string} id
   * @param {Object} requestingUser
   */
  async getPerformance(id, requestingUser = null) {
    if (!id) throw new Error('Performance record ID is required')

    const doc = await db.collection('academic_performances').doc(id).get()
    if (!doc.exists) throw new Error('Performance record not found')

    const record = doc.data()
    if (record.isDeleted) throw new Error('Performance record has been deleted')

    // Security check: Only Admins, Teachers, or the Parent of the child can view
    if (
      requestingUser &&
      requestingUser.role !== 'admin' &&
      requestingUser.role !== 'teacher' &&
      requestingUser.uid !== record.parentId
    ) {
      throw new Error(
        'Access Denied: You do not have permission to view this performance record.',
      )
    }

    return { id: doc.id, ...record }
  }

  /**
   * Updates an academic performance record.
   * @param {string} id
   * @param {Object} updateData
   * @param {Object} requestingUser
   */
  async updatePerformance(id, updateData, requestingUser = null) {
    if (!id) throw new Error('Performance record ID is required for update')

    const ref = db.collection('academic_performances').doc(id)
    const doc = await ref.get()
    if (!doc.exists) throw new Error('Performance record not found')

    const currentRecord = doc.data()
    if (currentRecord.isDeleted)
      throw new Error('Cannot update deleted performance record')

    const cleanUpdate = {
      ...(updateData.skillsMastered !== undefined && {
        skillsMastered: updateData.skillsMastered,
      }),
      ...(updateData.overallGrade !== undefined && {
        overallGrade: updateData.overallGrade,
      }),
      ...(updateData.teacherRemarks !== undefined && {
        teacherRemarks: updateData.teacherRemarks,
      }),
      ...(updateData.evaluationDate !== undefined && {
        evaluationDate: updateData.evaluationDate,
      }),
      updatedAt: new Date().toISOString(),
    }

    await ref.update(cleanUpdate)
    return { id, ...cleanUpdate }
  }

  /**
   * Soft deletes a performance record.
   * @param {string} id
   * @param {Object} requestingUser
   */
  async deletePerformance(id, requestingUser = null) {
    if (!id) throw new Error('Performance record ID is required for deletion')

    const ref = db.collection('academic_performances').doc(id)
    const doc = await ref.get()
    if (!doc.exists) throw new Error('Performance record not found')

    await ref.update({
      isDeleted: true,
      updatedAt: new Date().toISOString(),
    })

    return { message: 'Performance record soft-deleted successfully' }
  }
}

module.exports = new PerformanceService()

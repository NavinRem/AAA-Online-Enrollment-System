const { db, COLLECTIONS } = require('../config/database')

class PerformanceService {
  /**
   * Creates an academic performance evaluation record.
   * @param {Object} data
   * @param {Object} requestingUser
   */
  async createPerformance(data) {
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

    const [
      perfSnap,
      enrollSnap,
      classesSnap,
      programsSnap,
      branchesSnap,
      gradesSnap,
    ] = await Promise.all([
      db
        .collection('academic_performances')
        .where('studentId', '==', studentId)
        .where('isDeleted', '==', false)
        .get(),
      db
        .collection(COLLECTIONS.ENROLLMENT)
        .where('studentId', '==', studentId)
        .get(),
      db.collection(COLLECTIONS.CLASS).get(),
      db.collection(COLLECTIONS.PROGRAM).get(),
      db.collection(COLLECTIONS.BRANCH).get(),
      db
        .collection('student_grades')
        .where('studentId', '==', studentId)
        .get()
        .catch(() => ({ docs: [] })),
    ])

    const classesMap = new Map(
      classesSnap.docs.map((d) => [d.id, { id: d.id, ...d.data() }]),
    )
    const programsMap = new Map(
      programsSnap.docs.map((d) => [d.id, { id: d.id, ...d.data() }]),
    )
    const branchesMap = new Map(
      branchesSnap.docs.map((d) => [
        d.id,
        d.data().name || d.data().code || d.id,
      ]),
    )
    const gradesList =
      gradesSnap.docs?.map((d) => ({ id: d.id, ...d.data() })) || []

    const records = perfSnap.docs.map((doc) => {
      const data = doc.data()
      const clObj = classesMap.get(data.classId) || {}
      const prObj = programsMap.get(data.programId || clObj.programId) || {}
      const branchId =
        data.branchId ||
        clObj.branchId ||
        clObj.branchIds?.[0] ||
        studentData.branchId ||
        'AEON'
      const branchName = branchesMap.get(branchId) || branchId

      return {
        id: doc.id,
        ...data,
        className:
          data.className || clObj.name || prObj.name || 'Enrolled Class',
        programName: prObj.name || data.className || 'Enrolled Program',
        branchId: branchName,
        branchName,
        instructor: clObj.instructor || clObj.teacherName || 'Faculty',
        schedule: clObj.schedule || 'Regular Schedule',
        grades: gradesList.filter(
          (g) => g.classId === data.classId || g.termId === data.termId,
        ),
      }
    })

    // If no formal academic_performances exist yet for an enrolled class, generate summary cards from enrollments so parent sees real class context
    if (records.length === 0 && !enrollSnap.empty) {
      enrollSnap.docs.forEach((doc) => {
        const enr = doc.data()
        if (enr.isDeleted) return
        const clObj = classesMap.get(enr.classId) || {}
        const prObj = programsMap.get(enr.programId || clObj.programId) || {}
        const branchId =
          enr.branchId || clObj.branchId || studentData.branchId || 'AEON'
        const branchName = branchesMap.get(branchId) || branchId

        records.push({
          id: `enr_perf_${doc.id}`,
          studentId,
          classId: enr.classId || doc.id,
          termId: enr.termId || '',
          className:
            enr.programName || clObj.name || prObj.name || 'Class Program',
          programName: enr.programName || prObj.name || 'Academic Program',
          termName: enr.termName || 'Current Term',
          branchId: branchName,
          branchName,
          instructor:
            enr.instructor ||
            clObj.instructor ||
            clObj.teacherName ||
            'Faculty',
          schedule: enr.schedule || clObj.schedule || 'Regular Schedule',
          skillsMastered: [
            'Active Engagement',
            'Core Competencies',
            'Punctuality & Discipline',
          ],
          overallGrade: 'In Progress (Current Term)',
          teacherRemarks:
            'Student is currently enrolled and actively participating in class sessions.',
          evaluationDate: enr.enrollAt || new Date().toISOString(),
          isEnrollmentSummary: true,
          grades: gradesList.filter((g) => g.classId === enr.classId),
        })
      })
    }

    return records
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
  async updatePerformance(id, updateData) {
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
  async deletePerformance(id) {
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

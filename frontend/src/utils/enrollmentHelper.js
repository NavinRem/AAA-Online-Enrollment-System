import { isPaid, isCancelled, isUnpaid, getEnrollmentDisplayStatus } from './statusUtils'
import { parseDate } from './formatUtils'
import { getProgramProfileURL, getParentProfileURL, getStudentProfileURL } from './assetHelper'

/**
 * Calculates enrollment statistics for dashboard/list.
 */
export const calculateTotalEnrollment = (regs = []) => {
  const now = new Date()
  const today = new Date(now.setHours(0, 0, 0, 0)).getTime()

  return {
    total: regs.length,
    paidCount: regs.filter((r) => isPaid(r.paymentStatus) && !isCancelled(r.status)).length,
    unpaidCount: regs.filter((r) => isUnpaid(r.paymentStatus) && !isCancelled(r.status)).length,
    cancelledCount: regs.filter((r) => isCancelled(r.status)).length,
    todayCount: regs.filter((r) => parseDate(r.enrollAt || r.createdAt).getTime() >= today).length,
  }
}

/**
 * Enriches enrollment data using backend snapshots.
 */
export const enrichEnrollments = (
  regs = [],
  parents = [],
  students = [],
  programs = [],
  classes = [],
) => {
  return regs
    .map((r) => {
      const parent = r.parent || parents.find((p) => (p.uid || p.id) === r.parentId)
      const student = r.student || students.find((s) => (s.uid || s.id) === r.studentId)
      const prog = r.program || programs.find((p) => (p.id || p.uid) === r.programId)
      const classInst = r.class || classes.find((c) => c.id === r.classId)

      return {
        ...r,
        parent: parent
          ? { id: parent.id || parent.uid, name: parent.name, profileURL: parent.profileURL }
          : null,
        student: student
          ? { id: student.id || student.uid, name: student.name, profileURL: student.profileURL }
          : null,
        program: prog
          ? { id: prog.id || prog.uid, title: prog.title || prog.name, profileURL: prog.profileURL }
          : null,
        classSchedule:
          r.classSchedule || (classInst ? `${classInst.day} ${classInst.timeslot}` : 'N/A'),

        parentName: parent?.name || r.parentName || 'N/A',
        parentProfileURL: getParentProfileURL(parent?.profileURL || r.parentProfileURL),
        studentName: student?.name || r.studentName || 'N/A',
        studentProfileURL: getStudentProfileURL(student?.profileURL || r.studentProfileURL),
        programTitle: prog?.title || r.programTitle || 'N/A',
        programProfileURL: getProgramProfileURL(prog?.profileURL || r.programProfileURL),
        displayStatus: r.displayStatus || getEnrollmentDisplayStatus(r),
      }
    })
    .sort(
      (a, b) =>
        parseDate(b.enrollAt || b.createdAt).getTime() -
        parseDate(a.enrollAt || a.createdAt).getTime(),
    )
}

/**
 * Returns the logical academic status of an enrollment.
 */
export const getAcademicStatus = (r) => {
  if (!r) return 'Stopped'
  return r.academicStatus || r.status || 'Studying'
}

/**
 * Advanced filtering for Detail pages (Parent/Student).
 */
export const filterDetailEnrollments = (enrollments, filters = {}) => {
  if (!enrollments || !Array.isArray(enrollments)) return []

  return enrollments.filter((e) => {
    // 1. Filter by Student ID
    if (filters.studentId && filters.studentId !== 'all') {
      const sid = String(e.studentId || e.student?.id || '')
      if (sid !== String(filters.studentId)) return false
    }

    // 2. Filter by Academic Status
    if (filters.academicStatus && filters.academicStatus !== 'all') {
      const status = getAcademicStatus(e).toLowerCase()
      if (status !== filters.academicStatus.toLowerCase()) return false
    }

    // 3. Filter by Payment Status
    if (filters.paymentStatus && filters.paymentStatus !== 'all') {
      const pStatus = (e.paymentStatus || 'unpaid').toLowerCase()
      if (filters.paymentStatus === 'paid') {
        if (!isPaid(pStatus)) return false
      } else if (filters.paymentStatus === 'pending') {
        if (!isUnpaid(pStatus)) return false
      } else if (filters.paymentStatus === 'cancelled') {
        if (!isCancelled(e.status) && !isCancelled(e.paymentStatus)) return false
      } else {
        if (pStatus !== filters.paymentStatus.toLowerCase()) return false
      }
    }

    return true
  })
}

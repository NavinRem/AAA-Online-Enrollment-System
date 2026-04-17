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
 * Standardized to prioritize 'Direct Parent Only' backend snapshots.
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
      // 1. Favor backend snapshots if they exist
      const parent = r.parent || parents.find((p) => (p.uid || p.id) === r.parentId)
      const student = r.student || students.find((s) => (s.uid || s.id) === r.studentId)
      const prog =
        r.program || r.class?.program || programs.find((p) => (p.id || p.uid) === r.programId)
      const classInst = r.class || classes.find((c) => c.id === r.classId)
      
      const scheduleVal =
        r.class?.schedule ||
        r.classSchedule ||
        (classInst ? `${classInst.day} ${classInst.timeslot}` : 'N/A')

      return {
        ...r,
        parent: {
          id: parent?.id || parent?.uid || r.parentId,
          name: parent?.name || r.parent?.name || 'N/A',
          profileURL: getParentProfileURL(
            parent?.profileURL || r.parent?.profileURL,
          ),
          status: parent?.status || r.parent?.status || 'Active',
        },
        student: {
          id: student?.id || student?.uid || r.studentId,
          name: student?.name || r.student?.name || 'N/A',
          profileURL: getStudentProfileURL(
            student?.profileURL || r.student?.profileURL,
          ),
        },
        program: {
          id: prog?.id || prog?.uid || r.programId,
          name: prog?.name || prog?.title || r.program?.name || r.programTitle || 'N/A',
          profileURL: getProgramProfileURL(
            prog?.profileURL || prog?.profile || r.program?.profileURL,
          ),
          type: prog?.type || r.program?.type || 'Group',
        },
        branchAbbr: r.class?.branchAbbr || r.branchAbbr || classInst?.branch?.abbr || 'N/A',
        classSchedule: scheduleVal,

        // Direct access properties for table rendering (Backwards compatibility with templates)
        parentName: parent?.name || r.parent?.name || 'N/A',
        studentName: student?.name || r.student?.name || 'N/A',
        programName: prog?.name || prog?.title || r.program?.name || r.programTitle || 'N/A',
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

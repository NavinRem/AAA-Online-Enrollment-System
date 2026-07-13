import { parseDate } from './formatUtils'
import { getProgramProfileURL, getParentProfileURL, getStudentProfileURL } from './assetHelper'

import { isPaid, isPending } from '@/constants/status'

const CANCELLED_STATUSES = ['cancelled', 'canceled', 'stopped', 'deleted', 'transferred']

/**
 * Checks if an enrollment record was created as the destination of a class transfer.
 * Destination transfer records should be excluded from "New Enrollment" metrics.
 */
export const isTransferDestination = (r) => {
  if (!r) return false
  if (
    (r.transferredSessions && Number(r.transferredSessions) > 0) ||
    String(r.enrollmentType).toLowerCase() === 'transfer'
  )
    return true
  if (r.remark && String(r.remark).startsWith('Transfer from ')) return true
  return false
}

/**
 * Counts unique students from a list of enrollments, excluding incoming transfer records.
 */
export const countUniqueEnrollmentStudents = (enrollList = [], filterFn = null) => {
  const uniqueStudents = new Set()
  const items = enrollList || []
  items.forEach((r) => {
    if (filterFn && !filterFn(r)) return
    if (isTransferDestination(r)) return
    const sId = r.studentId || r.student?.id || r.childId
    if (sId) {
      uniqueStudents.add(String(sId))
    } else {
      uniqueStudents.add(r.id || r)
    }
  })
  return uniqueStudents.size
}

/**
 * Calculates high-level enrollment statistics for dashboards and overview cards.
 * Provides counts for total, paid, and recently added registrations.
 *
 * @param {Array} enroll - List of standardized enrollment records
 * @returns {Object} Metric summary
 */
export const calculateTotalEnrollment = (enroll = []) => {
  const now = new Date()
  const today = new Date(now.setHours(0, 0, 0, 0)).getTime()

  return {
    total: enroll.length,
    paidCount: enroll.filter(
      (r) =>
        isPaid(r.paymentStatus) && !CANCELLED_STATUSES.includes(String(r.status).toLowerCase()),
    ).length,
    unpaidCount: enroll.filter(
      (r) =>
        isPending(r.paymentStatus) && !CANCELLED_STATUSES.includes(String(r.status).toLowerCase()),
    ).length,
    cancelledCount: enroll.filter((r) =>
      CANCELLED_STATUSES.includes(String(r.status).toLowerCase()),
    ).length,
    todayCount: countUniqueEnrollmentStudents(
      enroll,
      (r) => parseDate(r.enrollAt || r.createdAt).getTime() >= today,
    ),
  }
}

/**
 * Enriches raw enrollment records by stitching together related entities
 * (Parents, Students, Programs, Classes) using their unique identifiers.
 * This pattern ensures the UI receives a high-integrity, flat object for easy rendering.
 */
export const enrichEnrollments = (
  enroll = [],
  parents = [],
  students = [],
  programs = [],
  classes = [],
) => {
  return enroll
    .map((r) => {
      const parent = r.parent || parents.find((p) => p.id === r.parentId)
      const student = r.student || students.find((s) => s.id === r.studentId)
      const classInst = r.class || classes.find((c) => c.id === r.classId)
      const programId = r.programId || r.class?.program?.id || classInst?.program?.id
      const program = programs.find((p) => p.id === programId) || r.program || r.class?.program

      const scheduleVal = classInst
        ? classInst.schedule
          ? `${classInst.schedule.day} (${classInst.schedule.time})`
          : 'N/A'
        : 'N/A'

      return {
        ...r,
        parent: parent
          ? {
              ...parent,
              name: parent.name || 'N/A',
              profileURL: getParentProfileURL(parent.profileURL),
              status: parent.status || 'Active',
            }
          : r.parent,
        student: student
          ? {
              ...student,
              name: student.name || 'N/A',
              profileURL: getStudentProfileURL(student.profileURL),
            }
          : r.student,
        program: program
          ? {
              id: program.id,
              name: program.name || 'N/A',
              profileURL: getProgramProfileURL(
                program.profileURL,
                program.category,
                program.categoryProfileURL,
              ),
              type: program.type || 'Group',
            }
          : r.program,
        paymentModeType: r.isProrated ? 'partial' : 'full',
        branchAbbr: classInst?.branch?.abbr || 'N/A',
        branchColor: classInst?.branch?.color || 'blue',
        branchId: r.branchId || classInst?.branch?.id || classInst?.branchId || '', // <- ADD THIS
        classSchedule: scheduleVal,
        currentCount: classInst?.currentCount || r.class?.currentCount || 0,
        capacity: classInst?.capacity || r.class?.capacity || 0,

        // Direct access properties for table rendering
        parentName: parent?.name || r.parentName || 'N/A',
        studentName: student?.name || r.studentName || 'N/A',
        programName: program?.name || r.programName || 'N/A',
        termName: classInst?.term?.name || r.class?.term?.name || 'N/A',
        teacherNames:
          classInst?.teachers?.map((t) => t.name).join(', ') || classInst?.teacher?.name || 'N/A',
        totalPrice: r.amount || 0,
        academicStatus: r.status || 'studying',
        enrollmentStatus: r.status || 'active',
        paymentStatus: r.paymentStatus || 'unpaid',
        status: String(r.status || r.paymentStatus || 'unpaid').toLowerCase(),
        class: classInst,
        termId: classInst?.term?.id || r.class?.term?.id || r.termId,
      }
    })
    .sort((a, b) => {
      // Put transferred/cancelled enrollments at the bottom, active on top
      const isAInactive = CANCELLED_STATUSES.includes(String(a.status || '').toLowerCase())
      const isBInactive = CANCELLED_STATUSES.includes(String(b.status || '').toLowerCase())
      if (isAInactive !== isBInactive) return isAInactive ? 1 : -1
      return parseDate(b.enrollAt).getTime() - parseDate(a.enrollAt).getTime()
    })
}

/**
 * Determines the logical academic status of an enrollment, defaulting to 'studying'
 * unless an explicit status is provided by the backend.
 *
 * @param {Object} r - Enriched enrollment record
 * @returns {string} Semantic academic status
 */
export const getAcademicStatus = (r) => {
  if (!r) return 'stopped'
  return String(r.academicStatus || r.status || 'studying').toLowerCase()
}

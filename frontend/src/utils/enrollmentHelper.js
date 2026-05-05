import { parseDate } from './formatUtils'
import { getProgramProfileURL, getParentProfileURL, getStudentProfileURL } from './assetHelper'

import { isPaid, isPending } from '@/constants/status'

const CANCELLED_STATUSES = ['cancelled', 'canceled', 'stopped', 'deleted']

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
    todayCount: enroll.filter((r) => parseDate(r.enrollAt || r.createdAt).getTime() >= today)
      .length,
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
      }
    })
    .sort((a, b) => parseDate(b.enrollAt).getTime() - parseDate(a.enrollAt).getTime())
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

/**
 * Performs complex filtering on the enrollment list for entity-specific detail pages.
 * Supports filtering by student, academic status, and financial state.
 *
 * @param {Array} enrollments - Enriched enrollment list
 * @param {Object} filters - Filter criteria { studentId, academicStatus, paymentStatus }
 * @returns {Array} Purified and filtered list
 */
export const filterDetailEnrollments = (enrollments, filters = {}) => {
  if (!enrollments || !Array.isArray(enrollments)) return []

  return enrollments.filter((e) => {
    // 1. Filter by Student ID
    if (filters.studentId && filters.studentId !== 'all') {
      const sid = String(e.student?.id || '')
      if (sid !== String(filters.studentId)) return false
    }

    // 2. Filter by Academic Status
    if (filters.academicStatus && filters.academicStatus !== 'all') {
      const status = getAcademicStatus(e).toLowerCase()
      if (status !== filters.academicStatus.toLowerCase()) return false
    }

    // 3. Filter by Payment Status
    if (filters.paymentStatus && filters.paymentStatus !== 'all') {
      const pStatus = e.paymentStatus.toLowerCase()
      if (filters.paymentStatus === 'paid') {
        if (!isPaid(pStatus)) return false
      } else if (filters.paymentStatus === 'pending') {
        if (!isPending(pStatus)) return false
      } else if (filters.paymentStatus === 'cancelled') {
        const sStatus = String(e.status || '').toLowerCase()
        if (!CANCELLED_STATUSES.includes(sStatus) && !CANCELLED_STATUSES.includes(pStatus))
          return false
      } else {
        if (pStatus !== filters.paymentStatus.toLowerCase()) return false
      }
    }

    return true
  })
}

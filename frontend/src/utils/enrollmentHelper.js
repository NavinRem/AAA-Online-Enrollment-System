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
  sessions = [],
) => {
  return regs
    .map((r) => {
      const parent = r.parent || parents.find((p) => (p.uid || p.id) === r.parentId)
      const student = r.student || students.find((s) => (s.uid || s.id) === r.studentId)
      const prog = r.program || programs.find((p) => (p.id || p.uid) === r.programId)
      const sess = sessions.find((s) => s.id === r.sessionId)

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
        sessionSchedule:
          r.sessionSchedule ||
          (sess?.schedule ? `${sess.schedule.day} ${sess.schedule.timeslot}` : 'N/A'),
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

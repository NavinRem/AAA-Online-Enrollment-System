import { parseDate } from './formatUtils'
import { isPaid } from './statusUtils'

/**
 * Calculates dashboard statistics.
 */
export const calculateDashboardStats = (
  allUsers = [],
  regs = [],
  progs = [],
  students = [],
  sessions = [],
  branches = [],
) => {
  const now = new Date()
  const today = new Date(now.setHours(0, 0, 0, 0)).getTime()
  const weekly = today - 7 * 86400000

  const getAmt = (r) => {
    let a = r.amount || r.totalAmount
    if (!a) {
      const p = progs.find((c) => (c.id || c.uid) === (r.programId || r.courseId))
      a = p ? p.price || 0 : 0
    }
    return parseFloat(String(a).replace(/[^0-9.]/g, '')) || 0
  }

  const inWindow = (r, s, e) => {
    const t = parseDate(r.enrollAt || r.createdAt).getTime()
    const u = parseDate(r.updatedAt || r.paidAt).getTime()
    return (t >= s && t <= e) || (u >= s && u <= e)
  }

  const todayRegs = (allUsers || []).filter(
    (u) => u.role === 'parent' && parseDate(u.createdAt).getTime() >= today,
  )
  const weekRegs = (allUsers || []).filter(
    (u) => u.role === 'parent' && parseDate(u.createdAt).getTime() >= weekly,
  )

  return {
    today: {
      reg: todayRegs.length,
      enroll: regs.filter((r) => parseDate(r.enrollAt || r.createdAt).getTime() >= today).length,
      pay:
        Math.round(
          regs
            .filter((r) => isPaid(r.paymentStatus) && inWindow(r, today, now.getTime()))
            .reduce((sum, r) => sum + getAmt(r), 0) * 100,
        ) / 100,
    },
    week: {
      reg: weekRegs.length,
      enroll: regs.filter((r) => parseDate(r.enrollAt || r.createdAt).getTime() >= weekly).length,
      pay:
        Math.round(
          regs
            .filter((r) => isPaid(r.paymentStatus) && inWindow(r, weekly, now.getTime()))
            .reduce((sum, r) => sum + getAmt(r), 0) * 100,
        ) / 100,
    },
    totals: {
      parents: (allUsers || []).filter((u) => u.role === 'parent').length,
      students: (students || []).length,
      programs: (progs || []).length,
      branches: (branches || []).length,
      enrollments: (regs || []).length,
      totalRevenue:
        Math.round(
          (regs || [])
            .filter((r) => isPaid(r.paymentStatus))
            .reduce((sum, r) => sum + getAmt(r), 0) * 100,
        ) / 100,
    },
  }
}

import { parseDate } from './formatUtils'
import { isPaid } from '@/constants/status'

/**
 * Utility for aggregating system-wide statistics for the administrative dashboard.
 * Processes high-volume data arrays to generate temporal (daily/weekly) and lifetime metrics.
 * Part of the "Universal Perfect State" data layer.
 */

/**
 * Calculates a comprehensive set of dashboard statistics across multiple entities.
 *
 * @param {Array} parents - List of all parent records
 * @param {Array} regs - List of enriched enrollment records
 * @param {Array} progs - List of program records
 * @param {Array} students - List of student records
 * @param {Array} classes - List of class records
 * @param {Array} branches - List of branch records
 * @param {Array} trials - List of trial lesson records
 * @returns {Object} Metric summary (daily, weekly, and lifetime totals)
 */
export const calculateDashboardStats = (
  parents = [],
  regs = [],
  progs = [],
  students = [],
  classes = [],
  branches = [],
  trials = [],
) => {
  const now = new Date()
  const today = new Date(now).setHours(0, 0, 0, 0)
  const weekly = today - 7 * 86400000

  /**
   * Internal helper to resolve the effective payment amount.
   * Prioritizes actual enrollment amount over program base price snapshots.
   */
  const getAmt = (r) => {
    // Prioritize the actual recorded amount over program snapshots for precise financial auditing
    const a = r.amount ?? 0
    return typeof a === 'number' ? a : parseFloat(String(a).replace(/[^0-9.]/g, '')) || 0
  }

  /**
   * Internal helper to check if a record falls within a specific time window.
   */
  const inWindow = (r, s, e) => {
    const t = parseDate(r.enrollAt || r.createdAt).getTime()
    const u = parseDate(r.paidAt).getTime()
    return (t >= s && t <= e) || (u >= s && u <= e)
  }

  const todayRegs = (parents || []).filter(
    (u) => parseDate(u.createdAt).getTime() >= today,
  )
  const weekRegs = (parents || []).filter(
    (u) => parseDate(u.createdAt).getTime() >= weekly,
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
      trial: trials.filter((t) => parseDate(t.createdAt || t.trialDate).getTime() >= today).length,
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
      trial: trials.filter((t) => parseDate(t.createdAt || t.trialDate).getTime() >= weekly).length,
    },
    totals: {
      parents: (parents || []).length,
      students: (students || []).length,
      programs: (progs || []).length,
      classes: (classes || []).length,
      branches: (branches || []).length,
      enrollments: (regs || []).length,
      trials: (trials || []).length,
      totalRevenue:
        Math.round(
          (regs || [])
            .filter((r) => isPaid(r.paymentStatus))
            .reduce((sum, r) => sum + getAmt(r), 0) * 100,
        ) / 100,
    },
  }
}

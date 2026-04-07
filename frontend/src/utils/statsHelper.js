import { parseDate } from './formatUtils'
import { isPaid } from './statusUtils'

/**
 * Calculates dashboard statistics.
 */
export const calculateDashboardStats = (allUsers = [], regs = [], progs = [], students = [], sessions = [], branches = []) => {
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

  const activeRegs = (regs || []).filter(r => (r.status || '').toLowerCase() !== 'cancelled')

  // Popularity Calculation
  const progCounts = activeRegs.reduce((acc, r) => {
    const id = r.programId || r.courseId
    acc[id] = (acc[id] || 0) + 1
    return acc
  }, {})

  let mostPopId = null, leastPopId = null
  let maxCount = -1, minCount = Infinity

  progs.forEach(p => {
    const count = progCounts[p.id] || 0
    if (count > maxCount) { maxCount = count; mostPopId = p.id }
    if (count < minCount) { minCount = count; leastPopId = p.id }
  })

  const mostPopProg = progs.find(p => p.id === mostPopId)
  const leastPopProg = progs.find(p => p.id === leastPopId)

  // Capacity Tracking
  const progSess = (sessions || []).reduce((acc, s) => {
    if (!acc[s.programId]) acc[s.programId] = { cap: 0, enrollment: 0 }
    acc[s.programId].cap += (s.capacity || 0)
    acc[s.programId].enrollment += (s.numStudent || 0)
    return acc
  }, {})

  let fullCount = 0, almostFullCount = 0, availCount = 0
  Object.values(progSess).forEach(p => {
    if (p.cap === 0) return
    const ratio = p.enrollment / p.cap
    if (ratio >= 1) fullCount++
    else if (ratio >= 0.8) almostFullCount++
    
    if (ratio < 1) availCount++
  })

  // Top Branch Calculation
  const branchCounts = (students || []).reduce((acc, s) => {
    const bId = s.branch?.id
    if (bId) acc[bId] = (acc[bId] || 0) + 1
    return acc
  }, {})

  let topBranchId = null, maxBranchCount = -1
  Object.keys(branchCounts).forEach(id => {
    if (branchCounts[id] > maxBranchCount) {
      maxBranchCount = branchCounts[id]
      topBranchId = id
    }
  })

  const topBranch = branches.find(b => b.id === topBranchId)

  const todayRegs = (allUsers || []).filter(
    (u) => ['parent', 'guardian'].includes(u.role) && parseDate(u.createdAt).getTime() >= today,
  )
  const weekRegs = (allUsers || []).filter(
    (u) => ['parent', 'guardian'].includes(u.role) && parseDate(u.createdAt).getTime() >= weekly,
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
      accounts: (allUsers || []).filter((u) => ['parent', 'guardian'].includes(u.role)).length,
      parents: (allUsers || []).filter((u) => u.role === 'parent').length,
      students: (students || []).length,
      programs: (progs || []).length,
      mostPopular: mostPopProg ? mostPopProg.title || mostPopProg.name : 'None',
      mostPopularCount: maxCount > 0 ? maxCount : 0,
      leastPopular: leastPopProg ? leastPopProg.title || leastPopProg.name : 'None',
      leastPopularCount: minCount !== Infinity ? minCount : 0,
      fullPrograms: fullCount,
      almostFullPrograms: almostFullCount,
      availablePrograms: availCount,
      topBranch: topBranch ? topBranch.name : 'None',
      topBranchCount: maxBranchCount > 0 ? maxBranchCount : 0
    },
  }
}

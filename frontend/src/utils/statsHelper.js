import { parseDate } from './dateFormatter'
import { isPaid } from './statusHelper'

/**
 * Calculates dashboard statistics based on the provided data arrays.
 */
export const calculateDashboardStats = (allUsers, enrollments, courses, students) => {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1

  const getExpectedAmount = (r) => {
    let amt = 0
    if (r.amount) amt = parseFloat(String(r.amount).replace(/[^0-9.]/g, ''))
    else if (r.totalAmount) amt = parseFloat(String(r.totalAmount).replace(/[^0-9.]/g, ''))
    else {
      const course = courses.find((c) => c.id === r.courseId)
      amt = course ? parseFloat(String(course.price || 0).replace(/[^0-9.]/g, '')) : 0
    }
    return isNaN(amt) ? 0 : amt
  }

  const todayAccounts = (allUsers || []).filter((u) => {
    if (u.role !== 'parent' && u.role !== 'guardian') return false
    const time = parseDate(u.createdAt || u.updatedAt).getTime()
    return time >= startOfToday && time <= endOfToday
  })

  const todayEnrollmentsList = (enrollments || []).filter((r) => {
    const time = parseDate(r.enrollAt || r.createdAt || r.updatedAt).getTime()
    return time >= startOfToday && time <= endOfToday
  })

  const parents = (allUsers || []).filter((u) => u.role === 'parent')
  const guardians = (allUsers || []).filter((u) => u.role === 'guardian')

  return {
    today: {
      reg: todayAccounts.length,
      enroll: todayEnrollmentsList.length,
      pay: todayEnrollmentsList.filter(r => isPaid(r.status || r.paymentStatus)).reduce((sum, r) => sum + getExpectedAmount(r), 0)
    },
    week: {
      reg: parents.length + guardians.length,
      enroll: (enrollments || []).length,
      pay: (enrollments || []).filter(r => isPaid(r.status || r.paymentStatus)).reduce((sum, r) => sum + getExpectedAmount(r), 0)
    },
    totals: {
      accounts: parents.length + guardians.length,
      parents: parents.length,
      guardians: guardians.length,
      students: (students || []).length,
      programs: (courses || []).length
    }
  }
}

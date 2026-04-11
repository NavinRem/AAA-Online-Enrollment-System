import { parseDate } from './formatUtils'

/**
 * Enriches parent data with linked students.
 */
export const enrichParents = (users = [], students = []) => {
  const byParent = students.reduce((acc, s) => {
    const pid = s.parentId
    if (pid) {
      if (!acc[pid]) acc[pid] = []
      acc[pid].push({
        id: s.id,
        name: s.name,
        dob: s.dob,
        profileURL: s.profileURL,
        status: s.status || 'Active',
      })
    }
    return acc
  }, {})

  return users
    .filter((u) => u.role === 'parent')
    .map((u) => ({
      ...u,
      studentInfo: byParent[u.uid || u.id] || u.studentInfo || [],
    }))
}

/**
 * Helper to check if a user was registered today.
 */
export const isRegisteredToday = (user, todayStart) => {
  const createdAt = user.createdAt?.toDate
    ? user.createdAt.toDate()
    : user.createdAt
      ? new Date(user.createdAt)
      : null
  return createdAt && createdAt.getTime() >= todayStart
}

/**
 * Helper to check if a parent has any enrollment paid today.
 */
export const hasPaidToday = (parentUid, enrollments = [], todayStart) => {
  return enrollments.some((e) => {
    if (e.parentId !== parentUid) return false
    const paidAt = e.paidAt?.toDate ? e.paidAt.toDate() : e.paidAt ? new Date(e.paidAt) : null
    if (!paidAt) return false
    return (e.status === 'paid' || e.status === 'confirmed') && paidAt.getTime() >= todayStart
  })
}

/**
 * Calculates parent-related statistics.
 */
export const calculateParentStats = (users = [], enrollments = []) => {
  const now = new Date()
  const todayStart = new Date(now.setHours(0, 0, 0, 0)).getTime()
  const parents = users.filter((u) => u.role === 'parent')

  const parentsPaidToday = parents.filter((p) =>
    hasPaidToday(p.uid || p.id, enrollments, todayStart),
  ).length

  return {
    parentCount: parents.length,
    todayCount: parents.filter((u) => isRegisteredToday(u, todayStart)).length,
    paidTodayCount: parentsPaidToday,
    activeCount: parents.filter((u) => (u.status || 'Active').toLowerCase() === 'active').length,
    totalUsers: users.length,
  }
}

/**
 * Robust filtering for Parent list.
 */
export const filterParents = (parents = [], enrollments = [], filterType = 'all') => {
  if (filterType === 'all') return parents

  const now = new Date()
  const todayStart = new Date(now.setHours(0, 0, 0, 0)).getTime()

  return parents.filter((u) => {
    const status = (u.status || 'Active').toLowerCase()
    switch (filterType) {
      case 'active':
        return status === 'active'
      case 'inactive':
        return status === 'inactive'
      case 'registered-today':
        return isRegisteredToday(u, todayStart)
      case 'paid-today':
        return hasPaidToday(u.uid || u.id, enrollments, todayStart)
      default:
        return true
    }
  })
}

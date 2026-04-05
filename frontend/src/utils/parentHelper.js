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
    .filter((u) => u.role === 'parent' || u.role === 'guardian')
    .map((u) => ({
      ...u,
      role: 'parent',
      studentInfo: byParent[u.uid || u.id] || u.studentInfo || [],
    }))
}

/**
 * Calculates parent-related statistics.
 */
export const calculateParentStats = (users = []) => {
  const now = new Date()
  const today = new Date(now.setHours(0, 0, 0, 0)).getTime()
  const parents = users.filter((u) => u.role === 'parent' || u.role === 'guardian')

  return {
    parentCount: parents.length,
    todayCount: parents.filter((u) => parseDate(u.createdAt).getTime() >= today).length,
    activeCount: parents.filter((u) => (u.status || 'Active').toLowerCase() === 'active').length,
    totalUsers: users.length,
  }
}

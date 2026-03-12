import { isPaid } from './statusHelper'

/**
 * Enriches parent/guardian data with linked students.
 */
export const enrichParents = (users = [], students = []) => {
  const studentsByParent = students.reduce((acc, s) => {
    const pId = s.parentId || s.parent_id
    if (pId) {
      if (!acc[pId]) acc[pId] = []
      acc[pId].push(s)
    }
    return acc
  }, {})

  return users
    .filter(u => u.role === 'parent' || u.role === 'guardian')
    .map(u => ({
      ...u,
      studentProfiles: studentsByParent[u.uid || u.id] || []
    }))
}

/**
 * Calculates parent-related statistics.
 */
export const calculateParentStats = (users = []) => {
  const today = new Date().toISOString().split('T')[0] // Safe: toISOString() always contains 'T'
  const parents = users.filter(u => u.role === 'parent')
  const guardians = users.filter(u => u.role === 'guardian')
  
  return {
    parentCount: parents.length,
    guardianCount: guardians.length,
    todayCount: users.filter(u => (u.createdAt || '').startsWith(today)).length,
    activeCount: users.filter(u => (u.status || 'Active').toLowerCase() === 'active').length
  }
}

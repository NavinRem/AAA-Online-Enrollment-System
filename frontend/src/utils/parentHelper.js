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
  const parents = users.filter(u => u.role === 'parent').length
  const guardians = users.filter(u => u.role === 'guardian').length
  const todayCount = users.filter(u => (u.createdAt || '').startsWith(new Date().toISOString().split('T')[0])).length
  const activeCount = users.filter(u => u.status === 'Active').length
  const totalUsers = users.length
  
  return {
    parentCount: parents  ,
    guardianCount: guardians,
    todayCount: todayCount,
    activeCount: activeCount,
    totalUsers: totalUsers
  }
}

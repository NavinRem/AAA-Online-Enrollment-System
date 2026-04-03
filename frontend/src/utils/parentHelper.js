/**
 * Enriches parent/guardian data with linked students.
 */
export const enrichParents = (users = [], students = []) => {
  const studentsByParent = students.reduce((acc, student) => {
    const parentId = student.parentId
    if (parentId) {
      if (!acc[parentId]) acc[parentId] = []
      
      // Standardize the snapshot data
      acc[parentId].push({
        id: student.id || student.uid,
        name: student.name || student.fullName || 'Student',
        dob: student.dob || student.DoB,
        profile: student.profile || student.profileURL || student.childProfileURL || null,
        medicalNote: student.medicalNote || 'None',
        status: student.status || 'Active'
      })
    }
    return acc
  }, {})

  return users
    .filter(u => u.role === 'parent' || u.role === 'guardian')
    .map(u => ({
      ...u,
      studentInfo: studentsByParent[u.uid || u.id] || u.studentInfo || []
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

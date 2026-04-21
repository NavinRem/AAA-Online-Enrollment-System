class ProfileHelper {
  getUserSnapshot(userId, userData) {
    if (!userId || !userData) return null
    return {
      id: userId,
      name: userData.name,
      profileURL: userData.profileURL || '',
      status: userData.status || 'active',
    }
  }

  getParentSnapshot(parentId, parentData) {
    const base = this.getUserSnapshot(parentId, parentData)
    if (!base) return null
    return {
      ...base,
      email: parentData.email,
      phone: parentData.phone,
    }
  }

  getStudentSnapshot(studentId, studentData) {
    if (!studentId || !studentData) return null

    const dob =
      studentData.dob instanceof Date
        ? studentData.dob
        : new Date(studentData.dob)

    return {
      id: studentId,
      name: studentData.name,
      profileURL: studentData.profileURL || '',
      status: studentData.status || 'active',
      dob,
      age: this.calculateAge(dob),
    }
  }

  getTeacherSnapshot(teacherId, teacherData) {
    return this.getUserSnapshot(teacherId, teacherData)
  }

  getProgramSnapshot(programId, programData) {
    if (!programId || !programData) return null
    return {
      id: programId,
      name: programData.name,
      totalSessions: programData.totalSessions || 0,
      basePrice: programData.basePrice || 0,
      description: programData.description || '',
      category: programData.category || '',
      level: programData.level || '',
      maxCapacity: programData.maxCapacity || 0,
      type: programData.type || '',
      profileURL: programData.profileURL || '',
    }
  }

  getBranchSnapshot(branchId, branchData) {
    if (!branchId || !branchData) return null
    return {
      id: branchId,
      name: branchData.name,
      abbr: branchData.abbr,
      location: branchData.location,
      phone: branchData.phone,
    }
  }

  getTermSnapshot(termId, data) {
    if (!termId || !data) return null
    return {
      id: termId,
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
    }
  }

  getClassSnapshot(classId, data) {
    if (!classId || !data) return null
    return {
      id: classId,
      program: data.program,
      term: data.term,
      branch: data.branch,
      teacher: data.teacher,
      schedules: data.schedules || [],
      status: data.status || 'open',
      maxCapacity: data.maxCapacity || 0,
      enrolledCount: data.enrolledCount || 0,
      isFull: (data.enrolledCount || 0) >= (data.maxCapacity || 0),
    }
  }

  getUpdatedSnapshot(existingSnapshot, updates) {
    if (!existingSnapshot) return null

    const allowedFields = Object.keys(existingSnapshot)

    const cleanUpdates = {}

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        cleanUpdates[key] = updates[key]
      }
    })

    return {
      ...existingSnapshot,
      ...cleanUpdates,
      id: existingSnapshot.id,
    }
  }

  calculateAge(dob) {
    if (!dob) return 0
    const birthDate = new Date(dob)
    if (isNaN(birthDate)) return 0
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }
}

module.exports = new ProfileHelper()

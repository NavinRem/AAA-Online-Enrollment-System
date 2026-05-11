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

    const dob = studentData.dob

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
    
    // Normalize category to an object if it's just a string or missing
    let category = programData.category
    if (typeof category === 'string') {
      category = { name: category, profileURL: '' }
    } else if (!category && programData.categorySnapshot) {
      category = programData.categorySnapshot
    }

    return {
      id: programId,
      name: programData.name,
      totalSessions: programData.totalSessions || 0,
      basePrice: programData.basePrice || 0,
      description: programData.description || '',
      type: programData.type || '',
      profileURL: programData.profileURL || '',
      duration: programData.duration || 0,
      minAge: programData.minAge || 0,
      maxAge: programData.maxAge || 0,
      category: category || { name: 'General', profileURL: '' },
      categoryId: programData.categoryId || '',
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
      color: branchData.color || 'blue',
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

  getCategorySnapshot(categoryId, data) {
    if (!categoryId || !data) return null
    return {
      id: categoryId,
      name: data.name,
    }
  }

  getLevelSnapshot(levelId, data) {
    if (!levelId || !data) return null
    return {
      id: levelId,
      name: data.name,
    }
  }

  getClassSnapshot(classId, data) {
    if (!classId || !data) return null
    const capacity = data.capacity || data.maxCapacity || 0
    const currentCount = data.currentCount || data.enrolledCount || 0
    return {
      id: classId,
      program: data.program,
      term: data.term,
      branch: data.branch,
      teachers: data.teachers || [],
      level: data.level || null,
      schedule: data.schedule || null,
      schedules: data.schedules || [],
      status: data.status || 'open',
      capacity,
      currentCount,
      isFull: capacity > 0 && currentCount >= capacity,
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
    // Handle both YYYY-MM-DD and ISO strings
    const dobStr = typeof dob === 'string' ? dob.split('T')[0] : dob
    const birthDate = new Date(dobStr)
    if (isNaN(birthDate)) return 0
    
    const today = new Date()
    // Compare in UTC to avoid local timezone issues during the calculation
    const todayDate = today.toISOString().split('T')[0]
    
    const [bYear, bMonth, bDay] = dobStr.split('-').map(Number)
    const [tYear, tMonth, tDay] = todayDate.split('-').map(Number)
    
    let age = tYear - bYear
    if (tMonth < bMonth || (tMonth === bMonth && tDay < bDay)) {
      age--
    }
    return age
  }

  ensureFreshAge(data) {
    if (!data) return data

    // 1. If it's a student object itself
    if (data.dob) {
      data.age = this.calculateAge(data.dob)
    }

    // 2. If it contains a nested student snapshot
    if (data.student && data.student.dob) {
      data.student.age = this.calculateAge(data.student.dob)
    }

    // 3. If it's a parent with childrenInfo array
    if (data.childrenInfo && Array.isArray(data.childrenInfo)) {
      data.childrenInfo = data.childrenInfo.map((child) => {
        if (child.dob) {
          child.age = this.calculateAge(child.dob)
        }
        return child
      })
    }

    return data
  }
}

module.exports = new ProfileHelper()

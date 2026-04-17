/**
 * ProfileHelper - Source of Truth for Data Snapshots
 * Used to ensure mirrored data is consistent across collections.
 */
class ProfileHelper {
  /**
   * BASE: Standardized snapshot for identity (Used by all people roles)
   */
  getUserSnapshot(userId, userData) {
    if (!userId || !userData) return null
    return {
      id: userId,
      name: userData.name,
      profileURL: userData.profileURL || null,
      status: userData.status || 'active',
    }
  }

  /**
   * SPECIFIC: Parent Snapshot (Extensions of User)
   */
  getParentSnapshot(parentId, parentData) {
    const base = this.getUserSnapshot(parentId, parentData)
    if (!base) return null
    return {
      ...base,
      email: parentData.email,
      phone: parentData.phone,
    }
  }

  /**
   * SPECIFIC: Student Snapshot (Extensions of User)
   */
  getStudentSnapshot(studentId, studentData) {
    const base = this.getUserSnapshot(studentId, studentData)
    if (!base) return null
    return {
      ...base,
      dob: studentData.dob,
      age: this.calculateAge(studentData.dob),
    }
  }

  /**
   * SPECIFIC: Teacher Snapshot (Extensions of User)
   */
  getTeacherSnapshot(teacherId, teacherData) {
    return this.getUserSnapshot(teacherId, teacherData)
  }

  /**
   * METADATA: Program (Product)
   */
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
      profileURL: programData.profileURL || null,
    }
  }

  /**
   * METADATA: Branch (Location)
   */
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

  /**
   * METADATA: Term (Academic Period)
   */
  getTermSnapshot(termId, data) {
    if (!termId || !data) return null
    return {
      id: termId,
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
    }
  }

  /**
   * MIRROR: Class (Operational Unit)
   */
  getClassSnapshot(classId, data) {
    if (!classId || !data) return null
    return {
      id: classId,
      program: data.program, // Snapshot of Program
      term: data.term,       // Snapshot of Term
      branch: data.branch,   // Snapshot of Branch
      teacher: data.teacher, // Snapshot of Teacher
      schedules: data.schedules || [],
      status: data.status || 'open',
      maxCapacity: data.maxCapacity || 0,
      enrolledCount: data.enrolledCount || 0,
      isFull: (data.enrolledCount || 0) >= (data.maxCapacity || 0),
    }
  }

  /**
   * Helper to merge updates into an existing snapshot
   */
  getUpdatedSnapshot(existingSnapshot, updates) {
    if (!existingSnapshot) return null
    return {
      ...existingSnapshot,
      ...updates,
      id: existingSnapshot.id,
    }
  }

  /**
   * Calculate age based on DOB string (YYYY-MM-DD)
   */
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

/**
 * ProfileHelper - Source of Truth for Data Snapshots
 * Used to ensure mirrored data (Parents/Students) is consistent across collections.
 */
class ProfileHelper {
  /**
   * Creates a standardized snapshot of a User (Admin or Parent)
   */
  getUserSnapshot(uid, userData) {
    if (!uid || !userData) return null;

    return {
      id: uid,
      uid: uid,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      role: userData.role,
      profileURL: userData.profileURL,
    };
  }

  /**
   * Creates a standardized snapshot of a Student
   */
  getStudentSnapshot(sid, studentData) {
    if (!sid || !studentData) return null;

    return {
      id: sid,
      sid: sid,
      name: studentData.name,
      dob: studentData.dob,
      medicalNote: studentData.medicalNote,
      profileURL: studentData.profileURL,
      status: studentData.status,
    };
  }

  /**
   * Helper to merge updates into an existing snapshot
   */
  getUpdatedSnapshot(existingSnapshot, updates) {
    if (!existingSnapshot) return null;
    return {
      ...existingSnapshot,
      ...updates,
      id: existingSnapshot.id,
    };
  }

  /**
   * Standardized Program Snapshot (Model Product)
   */
  getProgramSnapshot(programId, data) {
    if (!programId || !data) return null;

    return {
      id: programId,
      name: data.name || data.title, // Handle migration
      category: data.category,
      sessionNumber: data.sessionNumber || data.totalSessions || 0,
      weeksNumber: data.weeksNumber || 0,
      basePrice: data.basePrice || data.price || 0,
      maxCapacity: data.maxCapacity || 0,
      type: data.type || "group",
      profileURL: data.profileURL,
    };
  }

  /**
   * Standardized Term Snapshot
   */
  getTermSnapshot(termId, data) {
    if (!termId || !data) return null;
    return {
      id: termId,
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
    };
  }

  /**
   * Standardized Branch Snapshot
   */
  getBranchSnapshot(branchId, data) {
    if (!branchId || !data) return null;
    return {
      id: branchId,
      name: data.name,
      abbr: data.abbr,
      location: data.location,
    };
  }

  /**
   * Standardized Class Snapshot
   */
  getClassSnapshot(classId, data) {
    if (!classId || !data) return null;
    return {
      id: classId,
      program: data.program, // Mirror
      term: data.term, // Mirror
      branch: data.branch, // Mirror
      teacher: data.teacher, // Mirror
      day: data.day,
      timeslot: data.timeslot,
      status: data.status || "open",
      capacity: data.capacity || data.program?.maxCapacity || 0,
      numStudent: data.numStudent || 0,
      isFull:
        (data.numStudent || 0) >=
        (data.capacity || data.program?.maxCapacity || 0),
    };
  }
}

module.exports = new ProfileHelper();

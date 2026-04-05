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
   * Standardized Program Snapshot for Mirroring
   */
  getProgramSnapshot(programId, data) {
    if (!programId || !data) return null;

    return {
      id: programId,
      title: data.title,
      category: data.category,
      totalSessions: data.totalSessions,
      price: data.price,
      startDate: data.startDate,
      endDate: data.endDate,
      profileURL: data.profileURL,
      teachers: data.teachers,
    };
  }
}

module.exports = new ProfileHelper();

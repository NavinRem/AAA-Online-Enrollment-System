const { db, COLLECTIONS } = require("../../config/database");

class SessionService {
  async createSession(sessionData) {
    const { program_id, teachers, schedule, capacity } = sessionData;

    if (!program_id) {
      throw new Error("program_id is required");
    }

    const data = {
      program_id,
      teachers: teachers || [], // Array of { id, role }
      schedule: schedule || {}, // Map of { day, timeslot }
      capacity: parseInt(capacity) || 20,
      num_student: 0,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection(COLLECTIONS.SESSION).add(data);
    return { id: docRef.id, message: "Session created successfully" };
  }

  async getAvailableSessions(program_id) {
    const snapshot = await db
      .collection(COLLECTIONS.SESSION)
      .where("program_id", "==", program_id)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  async getAllSessions() {
    const snapshot = await db.collection(COLLECTIONS.SESSION).get();
    const sessions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Basic hydration (Teachers)
    // Fetch all teachers for hydration (supporting both roles for transition)
    const usersSnapshot = await db.collection(COLLECTIONS.USER).where("role", "in", ["teacher", "instructor"]).get();
    const teachersMap = {};
    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      teachersMap[doc.id] = {
        id: doc.id,
        name: userData.name || userData.email || "Unknown",
        profileURL: userData.profileURL || ""
      };
    });

    return sessions.map(s => ({
      ...s,
      teachers: (s.teachers || []).map(t => teachersMap[t.id] || t)
    }));
  }

  async validateCapacity(sessionId) {
    const doc = await db.collection(COLLECTIONS.SESSION).doc(sessionId).get();
    if (!doc.exists) {
      throw new Error("Session not found");
    }

    const data = doc.data();
    const available = (data.num_student || 0) < (data.capacity || 0);

    return {
      id: doc.id,
      hasCapacity: available,
      current: data.num_student || 0,
      capacity: data.capacity,
    };
  }

  async getSession(id) {
    const doc = await db.collection(COLLECTIONS.SESSION).doc(id).get();
    if (!doc.exists) {
      throw new Error("Session not found");
    }
    return { id: doc.id, ...doc.data() };
  }

  // 22. Assign Teacher
  async assignTeacher(sessionId, teachers) {
    const ref = db.collection(COLLECTIONS.SESSION).doc(sessionId);
    await ref.update({ teachers });
    return { message: "Teachers assigned successfully" };
  }

  // 15. Get Session Teachers
  async getSessionTeachers(sessionId) {
    const doc = await db.collection(COLLECTIONS.SESSION).doc(sessionId).get();
    if (!doc.exists) throw new Error("Session not found");
    return doc.data().teachers || [];
  }

  // 23. Sync Student Counts
  async syncStudentCounts(sessionId) {
    const ref = db.collection(COLLECTIONS.SESSION).doc(sessionId);

    // Count enrollments
    const snapshot = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where("session_id", "==", sessionId)
      .where("status", "in", ["confirmed", "pending"]) // Count active
      .count()
      .get();

    const count = snapshot.data().count;
    await ref.update({ num_student: count });

    return { message: "Student count synced", count };
  }
}

module.exports = new SessionService();

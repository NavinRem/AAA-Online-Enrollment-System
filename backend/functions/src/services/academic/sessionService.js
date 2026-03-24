const { db, COLLECTIONS } = require("../../config/database");

class SessionService {
  async createSession(sessionData) {
    const { programId, teachers, schedule, capacity } = sessionData;

    if (!programId) {
      throw new Error("programId is required");
    }

    const data = {
      programId,
      teachers: teachers || [], // Array of { id, role }
      schedule: schedule || {}, // Map of { day, timeslot }
      capacity: parseInt(capacity) || 20,
      numStudent: 0,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection(COLLECTIONS.SESSION).add(data);
    return { id: docRef.id, message: "Session created successfully" };
  }

  async getAvailableSessions(programId) {
    const snapshot = await db
      .collection(COLLECTIONS.SESSION)
      .where("programId", "==", programId)
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
    const available = (data.numStudent || 0) < (data.capacity || 0);

    return {
      id: doc.id,
      hasCapacity: available,
      current: data.numStudent || 0,
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

  // Assign Teacher
  async assignTeacher(sessionId, teachers) {
    const ref = db.collection(COLLECTIONS.SESSION).doc(sessionId);
    await ref.update({ teachers });
    return { message: "Teachers assigned successfully" };
  }

  // Get Session Teachers
  async getSessionTeachers(sessionId) {
    const doc = await db.collection(COLLECTIONS.SESSION).doc(sessionId).get();
    if (!doc.exists) throw new Error("Session not found");
    return doc.data().teachers || [];
  }

  // Sync Student Counts
  async syncStudentCounts(sessionId) {
    const ref = db.collection(COLLECTIONS.SESSION).doc(sessionId);

    // Count enrollments
    const snapshot = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where("sessionId", "==", sessionId)
      .where("status", "in", ["confirmed", "pending"])
      .get();

    const count = snapshot.docs.length;
    await ref.update({ numStudent: count });

    return { message: "Student count synced", count };
  }
}

module.exports = new SessionService();

const { db, COLLECTIONS } = require("../config/database");
const userService = require("./userService");

class SessionService {
  async createSession(sessionData) {
    const { programId, teachers, schedule, capacity, branch } = sessionData;

    if (!programId) {
      throw new Error("programId is required");
    }

    const data = {
      programId,
      branch: branch || null, // Snapshot: { id, name, abbr }
      teachers: teachers || [],
      schedule: schedule || {},
      capacity: parseInt(capacity || 15),
      numStudent: 0,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection(COLLECTIONS.SESSION).add(data);
    return { id: docRef.id, message: "Session created successfully" };
  }

  async getAvailableSessions(programId, branchId = null) {
    let query = db
      .collection(COLLECTIONS.SESSION)
      .where("programId", "==", programId);

    if (branchId) {
      query = query.where("branch.id", "==", branchId);
    }

    const snapshot = await query.get();

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

    const allUsers = await userService.getAllUsers();
    const teachersMap = {};
    allUsers.forEach((u) => {
      if (["teacher", "admin"].includes(u.role)) {
        teachersMap[u.uid] = {
          id: u.uid,
          name: u.name,
          profileURL: u.profileURL,
        };
      }
    });

    return sessions.map((s) => ({
      ...s,
      teachers: (s.teachers || []).map((t) => teachersMap[t.id] || t),
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
      current: data.numStudent,
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
    if (!sessionId) throw new Error("sessionId is required");
    const ref = db.collection(COLLECTIONS.SESSION).doc(sessionId);

    // Fetch all enrollments for this session
    const snapshot = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where("sessionId", "==", sessionId)
      .get();

    // Filter in-memory to handle various 'cancelled' variants
    const activeEnrollments = snapshot.docs.filter((doc) => {
      const status = (doc.data().status || "").toLowerCase();
      return !["cancelled", "canceled"].includes(status);
    });

    const count = activeEnrollments.length;
    await ref.update({ numStudent: count });

    return { id: sessionId, count };
  }

  // Sync All Sessions
  async syncAllSessionCounts() {
    const snapshot = await db.collection(COLLECTIONS.SESSION).get();
    const results = [];

    for (const doc of snapshot.docs) {
      try {
        const result = await this.syncStudentCounts(doc.id);
        results.push(result);
      } catch (err) {
        console.error(`Failed to sync session ${doc.id}:`, err);
      }
    }

    return {
      message: `Synchronized ${results.length} sessions`,
      details: results,
    };
  }
}

module.exports = new SessionService();

const { getFirestore } = require("firebase-admin/firestore");
const db = getFirestore("registration");

class SessionService {
  async createSession(sessionData) {
    const { course_id, instructors, schedule, capacity } = sessionData;

    if (!course_id) {
      throw new Error("course_id is required");
    }

    const data = {
      course_id,
      instructors: instructors || [], // Array of { id, role }
      schedule: schedule || {}, // Map of { day, timeslot }
      capacity: parseInt(capacity) || 20,
      num_student: 0,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("session").add(data);
    return { id: docRef.id, message: "Session created successfully" };
  }

  async getAvailableSessions(course_id) {
    const snapshot = await db
      .collection("session")
      .where("course_id", "==", course_id)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  async validateCapacity(sessionId) {
    const doc = await db.collection("session").doc(sessionId).get();
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
    const doc = await db.collection("session").doc(id).get();
    if (!doc.exists) {
      throw new Error("Session not found");
    }
    return { id: doc.id, ...doc.data() };
  }

  // 22. Assign Instructor
  async assignInstructor(sessionId, instructors) {
    // instructors = array of { id, role }
    const ref = db.collection("session").doc(sessionId);
    await ref.update({ instructors });
    return { message: "Instructors assigned successfully" };
  }

  // 15. Get Instructor Roster
  async getInstructorRoster(sessionId) {
    const doc = await db.collection("session").doc(sessionId).get();
    if (!doc.exists) throw new Error("Session not found");
    return doc.data().instructors || [];
  }

  // 23. Sync Student Counts
  async syncStudentCounts(sessionId) {
    const ref = db.collection("session").doc(sessionId);

    // Count enrollments
    const snapshot = await db
      .collection("enrollment")
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

const { db, COLLECTIONS } = require("../../config/database");

class AttendanceService {
  // Mark Check-In
  async markCheckIn(data) {
    const { studentId, sessionId, timestamp } = data;
    const ref = db.collection(COLLECTIONS.ATTENDANCE).doc();
    await ref.set({
      studentId,
      sessionId,
      type: "check-in",
      timestamp: timestamp || new Date().toISOString(),
      status: "present",
    });
    return { message: "Check-in recorded" };
  }

  // Mark Check-Out
  async markCheckOut(data) {
    const { studentId, sessionId, timestamp } = data;
    const ref = db.collection(COLLECTIONS.ATTENDANCE).doc();
    await ref.set({
      studentId,
      sessionId,
      type: "check-out",
      timestamp: timestamp || new Date().toISOString(),
      status: "checked-out",
    });
    return { message: "Check-out recorded" };
  }

  // Get Attendance History (Student)
  async getAttendanceHistory(studentId) {
    const snapshot = await db
      .collection(COLLECTIONS.ATTENDANCE)
      .where("studentId", "==", studentId)
      .orderBy("timestamp", "desc")
      .get();
    return snapshot.docs.map((doc) => doc.data());
  }

  // Get Attendance Logs (Session)
  async getAttendanceLogs(sessionId) {
    const snapshot = await db
      .collection(COLLECTIONS.ATTENDANCE)
      .where("sessionId", "==", sessionId)
      .orderBy("timestamp", "desc")
      .get();
    return snapshot.docs.map((doc) => doc.data());
  }

  // Request Make-Up Session
  async requestMakeUpSession(data) {
    const { studentId, oldSessionId, newSessionId, reason } = data;
    // Logic to check rules...
    await db.collection(COLLECTIONS.REQUEST).add({
      type: "makeup",
      studentId,
      oldSessionId,
      newSessionId,
      reason,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    return { message: "Make-up request submitted" };
  }
}

module.exports = new AttendanceService();

const { getFirestore } = require("firebase-admin/firestore");
const db = getFirestore("registration");

class AttendanceService {
  // 16. Mark Check-In
  async markCheckIn(data) {
    const { studentID, sessionID, timestamp } = data;
    const ref = db.collection("attendance").doc();
    await ref.set({
      studentID,
      sessionID,
      type: "check-in",
      timestamp: timestamp || new Date().toISOString(),
      status: "present",
    });
    return { message: "Check-in recorded" };
  }

  // 17. Mark Check-Out
  async markCheckOut(data) {
    const { studentID, sessionID, timestamp } = data;
    const ref = db.collection("attendance").doc();
    await ref.set({
      studentID,
      sessionID,
      type: "check-out",
      timestamp: timestamp || new Date().toISOString(),
      status: "checked-out",
    });
    return { message: "Check-out recorded" };
  }

  // 14. Get Attendance History (Student)
  async getAttendanceHistory(studentID) {
    const snapshot = await db
      .collection("attendance")
      .where("studentID", "==", studentID)
      .orderBy("timestamp", "desc")
      .get();
    return snapshot.docs.map((doc) => doc.data());
  }

  // 20. Get Attendance Logs (Session)
  async getAttendanceLogs(sessionID) {
    const snapshot = await db
      .collection("attendance")
      .where("sessionID", "==", sessionID)
      .orderBy("timestamp", "desc")
      .get();
    return snapshot.docs.map((doc) => doc.data());
  }

  // 18. Request Make-Up Session
  async requestMakeUpSession(data) {
    const { studentId, oldSessionId, newSessionId, reason } = data;
    // Logic to check rules...
    await db.collection("requests").add({
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

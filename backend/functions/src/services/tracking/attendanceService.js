const { getFirestore } = require("firebase-admin/firestore");
const db = getFirestore("registration");

class AttendanceService {
  // 16. Mark Check-In
  async markCheckIn(data) {
    const { student_id, session_id, timestamp } = data;
    const ref = db.collection("attendance").doc();
    await ref.set({
      student_id,
      session_id,
      type: "check-in",
      timestamp: timestamp || new Date().toISOString(),
      status: "present",
    });
    return { message: "Check-in recorded" };
  }

  // 17. Mark Check-Out
  async markCheckOut(data) {
    const { student_id, session_id, timestamp } = data;
    const ref = db.collection("attendance").doc();
    await ref.set({
      student_id,
      session_id,
      type: "check-out",
      timestamp: timestamp || new Date().toISOString(),
      status: "checked-out",
    });
    return { message: "Check-out recorded" };
  }

  // 14. Get Attendance History (Student)
  async getAttendanceHistory(student_id) {
    const snapshot = await db
      .collection("attendance")
      .where("student_id", "==", student_id)
      .orderBy("timestamp", "desc")
      .get();
    return snapshot.docs.map((doc) => doc.data());
  }

  // 20. Get Attendance Logs (Session)
  async getAttendanceLogs(session_id) {
    const snapshot = await db
      .collection("attendance")
      .where("session_id", "==", session_id)
      .orderBy("timestamp", "desc")
      .get();
    return snapshot.docs.map((doc) => doc.data());
  }

  // 18. Request Make-Up Session
  async requestMakeUpSession(data) {
    const { student_id, old_session_id, new_session_id, reason } = data;
    // Logic to check rules...
    await db.collection("requests").add({
      type: "makeup",
      student_id,
      old_session_id,
      new_session_id,
      reason,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    return { message: "Make-up request submitted" };
  }
}

module.exports = new AttendanceService();

const { db, COLLECTIONS } = require("../../config/database");

class ProgressService {
  // Get Student Progress
  async getStudentProgress(studentId) {
    // Placeholder logic:
    const snapshot = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where("studentId", "==", studentId)
      .where("status", "==", "confirmed")
      .get();

    const enrollments = snapshot.docs.map((doc) => doc.data());

    return {
      studentId: studentId,
      enrolledPrograms: enrollments.length,
      overallProgress: "On Track",
      details: enrollments.map((e) => ({
        programId: e.programId,
        status: "In Progress",
        completion: "25%", // Mock
      })),
    };
  }
}

module.exports = new ProgressService();

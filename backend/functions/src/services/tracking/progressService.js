const { getFirestore } = require("firebase-admin/firestore");
const db = getFirestore("registration");

class ProgressService {
  // 13. Get Student Progress
  async getStudentProgress(studentId) {
    // Placeholder logic:
    // Data could come from a 'grades' collection or calculated from attendance/enrollments.
    // For now, let's return a mocked summary based on enrollment count.

    const snapshot = await db
      .collection("enrollment")
      .where("student_id", "==", studentId)
      .where("status", "==", "confirmed")
      .get();

    const enrollments = snapshot.docs.map((doc) => doc.data());

    // Mocked progress: 10% progress per session enrolled?
    // In real app, we'd query a 'progress' or 'grades' collection.

    return {
      student_id: studentId,
      enrolledCourses: enrollments.length,
      overallProgress: "On Track",
      details: enrollments.map((e) => ({
        course_id: e.course_id,
        status: "In Progress",
        completion: "25%", // Mock
      })),
    };
  }
}

module.exports = new ProgressService();

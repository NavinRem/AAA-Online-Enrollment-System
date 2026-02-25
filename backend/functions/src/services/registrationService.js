const { getFirestore } = require("firebase-admin/firestore");
const db = getFirestore("registration");

class RegistrationService {
  async createEnrollment(enrollmentData) {
    const { studentID, courseID, sessionID } = enrollmentData;

    if (!studentID || !courseID || !sessionID) {
      throw new Error("studentID, courseID, and sessionID are required");
    }

    await db.runTransaction(async (transaction) => {
      // 1. Get References
      const sessionRef = db.collection("session").doc(sessionID);
      const studentRef = db.collection("student").doc(studentID);
      const courseRef = db.collection("course").doc(courseID);

      // Check for existing enrollment
      const existingEnrollmentQuery = db
        .collection("enrollment")
        .where("studentID", "==", studentID)
        .where("sessionID", "==", sessionID);

      const [sessionDoc, studentDoc, courseDoc, existingEnrollmentSnapshot] =
        await Promise.all([
          transaction.get(sessionRef),
          transaction.get(studentRef),
          transaction.get(courseRef),
          transaction.get(existingEnrollmentQuery),
        ]);

      // 2. Validations
      if (!sessionDoc.exists) throw new Error("Session not found");
      if (!studentDoc.exists) throw new Error("Student not found");
      if (!courseDoc.exists) throw new Error("Course not found");

      if (!existingEnrollmentSnapshot.empty) {
        throw new Error("Student already registered for this session");
      }

      const sessionData = sessionDoc.data();
      if ((sessionData.num_student || 0) >= sessionData.capacity) {
        throw new Error("Session is full");
      }

      // 3. Create Enrollment Document
      const enrollmentRef = db.collection("enrollment").doc();
      const data = {
        studentID,
        sessionID,
        courseID,
        parentID: studentDoc.data().parentID, // Fetch from student doc
        status: "pending",
        paymentStatus: "unpaid",
        enrollAt: new Date().toISOString(),
      };

      transaction.set(enrollmentRef, data);

      // 4. Update Session Enrollment Count
      transaction.update(sessionRef, {
        num_student: (sessionData.num_student || 0) + 1,
      });
    });

    return { message: "Enrollment created successfully" };
  }

  async getStudentEligibility(studentId, courseId) {
    const studentDoc = await db.collection("student").doc(studentId).get();
    const courseDoc = await db.collection("course").doc(courseId).get();

    if (!studentDoc.exists || !courseDoc.exists) {
      throw new Error("Student or Course not found");
    }

    // Placeholder logic
    return { eligible: true, reason: "Met requirements" };
  }

  async getAllRegistrations() {
    const snapshot = await db.collection("enrollment").get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  async getRegistration(id) {
    const doc = await db.collection("enrollment").doc(id).get();
    if (!doc.exists) {
      throw new Error("Registration not found");
    }
    return { id: doc.id, ...doc.data() };
  }

  // 9. Cancel Registration
  async cancelRegistration(enrollmentId) {
    const enrollmentRef = db.collection("enrollment").doc(enrollmentId);
    const doc = await enrollmentRef.get();

    if (!doc.exists) throw new Error("Registration not found");

    const data = doc.data();
    if (data.status === "cancelled") throw new Error("Already cancelled");

    // Transaction to update enrollment and decrease session count
    await db.runTransaction(async (transaction) => {
      transaction.update(enrollmentRef, {
        status: "cancelled",
        updatedAt: new Date().toISOString(),
      });

      const sessionRef = db.collection("session").doc(data.sessionID);
      const sessionDoc = await transaction.get(sessionRef);

      if (sessionDoc.exists) {
        const currentCount = sessionDoc.data().num_student || 0;
        if (currentCount > 0) {
          transaction.update(sessionRef, { num_student: currentCount - 1 });
        }
      }
    });

    return { message: "Registration cancelled successfully" };
  }
}

module.exports = new RegistrationService();

const { getFirestore } = require("firebase-admin/firestore");
const db = getFirestore("registration");

class RegistrationService {
  async createEnrollment(enrollmentData) {
    const { student_id, course_id, session_id } = enrollmentData;

    if (!student_id || !course_id || !session_id) {
      throw new Error("student_id, course_id, and session_id are required");
    }

    let enrollmentId;
    await db.runTransaction(async (transaction) => {
      // 1. Get References
      const sessionRef = db.collection("session").doc(session_id);
      const studentRef = db.collection("student").doc(student_id);
      const courseRef = db.collection("course").doc(course_id);

      // Check for existing enrollment
      const existingEnrollmentQuery = db
        .collection("enrollment")
        .where("student_id", "==", student_id)
        .where("session_id", "==", session_id);

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
      const courseData = courseDoc.data();
      if ((sessionData.num_student || 0) >= sessionData.capacity) {
        throw new Error("Session is full");
      }

      // 3. Create Enrollment Document
      const enrollmentRef = db.collection("enrollment").doc();
      enrollmentId = enrollmentRef.id;
      const data = {
        student_id,
        session_id,
        course_id,
        parent_id: studentDoc.data().parent_id, // Fetch from student doc
        status: "pending",
        paymentStatus: "unpaid",
        amount: courseData.price || 0,
        totalAmount: courseData.price || 0,
        enrollAt: new Date().toISOString(),
      };

      transaction.set(enrollmentRef, data);

      // 4. Update Session Enrollment Count
      transaction.update(sessionRef, {
        num_student: (sessionData.num_student || 0) + 1,
      });
    });

    return { id: enrollmentId, message: "Enrollment created successfully" };
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
    const [snapshot, usersSnap, studentsSnap, coursesSnap] = await Promise.all([
      db.collection("enrollment").get(),
      db.collection("user").get(),
      db.collection("student").get(),
      db.collection("course").get(),
    ]);

    const usersMap = {};
    usersSnap.forEach((doc) => (usersMap[doc.id] = doc.data()));

    const studentsMap = {};
    studentsSnap.forEach((doc) => (studentsMap[doc.id] = doc.data()));

    const coursesMap = {};
    coursesSnap.forEach((doc) => (coursesMap[doc.id] = doc.data()));

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      const parentName =
        usersMap[data.parent_id]?.name ||
        usersMap[data.parent_id]?.email ||
        "Unknown Parent";
      const studentName =
        studentsMap[data.student_id]?.fullname ||
        studentsMap[data.student_id]?.name ||
        "Unknown Student";
      const courseTitle =
        coursesMap[data.course_id]?.title ||
        coursesMap[data.course_id]?.name ||
        "Unknown Course";

      return {
        id: doc.id,
        ...data,
        parentName,
        studentName,
        courseTitle,
        amount:
          data.amount ||
          data.totalAmount ||
          coursesMap[data.course_id]?.price ||
          0,
      };
    });
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

      const sessionRef = db.collection("session").doc(data.session_id);
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

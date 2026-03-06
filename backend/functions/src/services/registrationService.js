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
    const [snapshot, usersSnap, studentsSnap, coursesSnap, sessionsSnap] = await Promise.all([
      db.collection("enrollment").get(),
      db.collection("user").get(),
      db.collection("student").get(),
      db.collection("course").get(),
      db.collection("session").get(),
    ]);

    const usersMap = {};
    usersSnap.forEach((doc) => (usersMap[doc.id] = doc.data()));

    const studentsMap = {};
    studentsSnap.forEach((doc) => (studentsMap[doc.id] = doc.data()));

    const coursesMap = {};
    coursesSnap.forEach((doc) => (coursesMap[doc.id] = doc.data()));

    const sessionsMap = {};
    sessionsSnap.forEach((doc) => {
      const s = doc.data();
      // Format schedule string
      const scheduleLines = [];
      if (s.schedule) {
        Object.keys(s.schedule).forEach((day) => {
          scheduleLines.push(`${day}: ${s.schedule[day]}`);
        });
      }
      sessionsMap[doc.id] = {
        ...s,
        scheduleString: scheduleLines.join(", ") || "N/A",
      };
    });

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

      const session = sessionsMap[data.session_id];

      return {
        id: doc.id,
        ...data,
        parentName,
        studentName,
        courseTitle,
        sessionSchedule: session?.scheduleString || "N/A",
        sessionCount:
          session?.totalSessions || session?.total_sessions || session?.sessionCount || 10, // Default to 10 if not found
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

    // Fetch related documents in parallel with robust checks
    const [userDoc, studentDoc, courseDoc, sessionDoc] = await Promise.all([
      data.parent_id ? db.collection("user").doc(data.parent_id).get() : Promise.resolve({ exists: false }),
      data.student_id ? db.collection("student").doc(data.student_id).get() : Promise.resolve({ exists: false }),
      data.course_id ? db.collection("course").doc(data.course_id).get() : Promise.resolve({ exists: false }),
      data.session_id ? db.collection("session").doc(data.session_id).get() : Promise.resolve({ exists: false }),
    ]);

    const userData = userDoc.exists ? userDoc.data() : null;
    const studentData = studentDoc.exists ? studentDoc.data() : null;
    const courseData = courseDoc.exists ? courseDoc.data() : null;
    const sessionData = sessionDoc.exists ? sessionDoc.data() : null;

    // Format schedule for consistency
    let sessionSchedule = data.sessionSchedule || "N/A";
    if (sessionData && sessionData.schedule) {
      const scheduleLines = [];
      Object.keys(sessionData.schedule).forEach((day) => {
        scheduleLines.push(`${day}: ${sessionData.schedule[day]}`);
      });
      sessionSchedule = scheduleLines.join(", ");
    }

    // Robust instructor name resolution
    let instructorName = "Not Assigned";
    if (sessionData && sessionData.instructors && sessionData.instructors.length > 0) {
      const first = sessionData.instructors[0];
      if (first.name) {
        instructorName = first.name;
      } else if (first.id) {
        const instDoc = await db.collection("user").doc(first.id).get();
        if (instDoc.exists) {
          instructorName = instDoc.data().name || instDoc.data().email || "Assigned";
        }
      }
    }

    return {
      id: doc.id,
      ...data,
      parentName: userData?.name || userData?.email || data.parentName || "N/A",
      parentEmail: userData?.email || "N/A",
      parentPhone: userData?.phone || "N/A",
      parentRole: userData?.role ? (userData.role === 'parent' ? 'Parent' : userData.role.charAt(0).toUpperCase() + userData.role.slice(1)) : "Guardian",
      parentCreatedAt: userData?.createdAt || userData?.created_at || null,
      studentName: studentData?.fullname || studentData?.name || data.studentName || "N/A",
      studentDob: studentData?.dob || studentData?.DoB || null,
      medicalNote: studentData?.medicalNotes || studentData?.medical_note || "None",
      courseTitle: courseData?.title || courseData?.name || data.courseTitle || "N/A",
      sessionSchedule: sessionSchedule,
      instructorName,
      capacity: sessionData?.capacity || 0,
      num_student: sessionData?.num_student || 0,
      totalSessions: sessionData?.totalSessions || sessionData?.total_sessions || 10,
      startDate: sessionData?.startDate || null,
      endDate: sessionData?.endDate || null,
    };
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
      const sessionRef = db.collection("session").doc(data.session_id);
      const sessionDoc = await transaction.get(sessionRef);

      transaction.update(enrollmentRef, {
        status: "cancelled",
        updatedAt: new Date().toISOString(),
      });

      if (sessionDoc.exists) {
        const currentCount = sessionDoc.data().num_student || 0;
        if (currentCount > 0) {
          transaction.update(sessionRef, { num_student: currentCount - 1 });
        }
      }
    });

    return { message: "Registration cancelled successfully" };
  }

  // 10. Update Registration
  async updateRegistration(enrollmentId, updateData) {
    const enrollmentRef = db.collection("enrollment").doc(enrollmentId);
    const doc = await enrollmentRef.get();

    if (!doc.exists) throw new Error("Registration not found");

    // Clean data safely
    const safeData = { ...updateData, updatedAt: new Date().toISOString() };
    delete safeData.id;

    await enrollmentRef.update(safeData);

    return { id: enrollmentId, ...safeData };
  }

  // 11. Delete Registration Permanently
  async deleteRegistration(enrollmentId) {
    const enrollmentRef = db.collection("enrollment").doc(enrollmentId);
    const doc = await enrollmentRef.get();

    if (!doc.exists) throw new Error("Registration not found");

    const data = doc.data();

    // If active/pending, we must reduce session count before deleting
    if (data.status !== "cancelled" && data.status !== "canceled") {
      await db.runTransaction(async (transaction) => {
        const sessionRef = db.collection("session").doc(data.session_id);
        const sessionDoc = await transaction.get(sessionRef); // ALL READS FIRST

        if (sessionDoc.exists) {
          const currentCount = sessionDoc.data().num_student || 0;
          if (currentCount > 0) {
            transaction.update(sessionRef, { num_student: currentCount - 1 });
          }
        }
        transaction.delete(enrollmentRef); // WRITES SECOND
      });
    } else {
      // It was already cancelled, just delete it
      await enrollmentRef.delete();
    }

    return { message: "Registration deleted permanently" };
  }
}

module.exports = new RegistrationService();

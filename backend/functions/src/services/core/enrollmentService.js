const { getFirestore } = require("firebase-admin/firestore");
const db = getFirestore("registration");

class EnrollmentService {
  async createEnrollment(enrollmentData) {
    const { studentId, courseId, sessionId } = enrollmentData;

    if (!studentId || !courseId || !sessionId) {
      throw new Error("studentId, courseId, and sessionId are required");
    }

    let enrollmentId;
    await db.runTransaction(async (transaction) => {
      const sessionRef = db.collection("session").doc(sessionId);
      const studentRef = db.collection("student").doc(studentId);
      const courseRef = db.collection("courses").doc(courseId);

      const existingEnrollmentQuery = db
        .collection("enrollment")
        .where("studentId", "==", studentId)
        .where("sessionId", "==", sessionId);

      const [sessionDoc, studentDoc, courseDoc, existingEnrollmentSnapshot] =
        await Promise.all([
          transaction.get(sessionRef),
          transaction.get(studentRef),
          transaction.get(courseRef),
          transaction.get(existingEnrollmentQuery),
        ]);

      if (!sessionDoc.exists) throw new Error("Session not found");
      if (!studentDoc.exists) throw new Error("Student not found");
      if (!courseDoc.exists) throw new Error("Course not found");

      if (!existingEnrollmentSnapshot.empty) {
        throw new Error("Student already enrolled for this session");
      }

      const sessionData = sessionDoc.data();
      const courseData = courseDoc.data();
      if ((sessionData.numStudent || 0) >= sessionData.capacity) {
        throw new Error("Session is full");
      }

      const enrollmentRef = db.collection("enrollment").doc();
      enrollmentId = enrollmentRef.id;
      const data = {
        studentId,
        sessionId,
        courseId,
        parentId: studentDoc.data().parentId, 
        status: "pending",
        paymentStatus: "unpaid",
        amount: courseData.price || 0,
        totalAmount: courseData.price || 0,
        enrollAt: new Date().toISOString(),
      };

      transaction.set(enrollmentRef, data);

      transaction.update(sessionRef, {
        numStudent: (sessionData.numStudent || 0) + 1,
      });
    });

    return { id: enrollmentId, message: "Enrollment created successfully" };
  }

  async getStudentEligibility(studentId, courseId) {
    // Placeholder for eligibility logic
    return { eligible: true, studentId, courseId };
  }

  async getAllEnrollments() {
    const [snapshot, usersSnap, studentsSnap, coursesSnap, sessionsSnap] = await Promise.all([
      db.collection("enrollment").get(),
      db.collection("user").get(),
      db.collection("student").get(),
      db.collection("courses").get(),
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
        usersMap[data.parentId]?.name ||
        usersMap[data.parentId]?.email ||
        "Unknown Parent";
      const studentName =
        studentsMap[data.studentId]?.fullName ||
        studentsMap[data.studentId]?.name ||
        "Unknown Student";
      const courseTitle =
        coursesMap[data.courseId]?.title ||
        coursesMap[data.courseId]?.name ||
        "Unknown Course";

      const session = sessionsMap[data.sessionId];

      return {
        id: doc.id,
        ...data,
        parentName,
        studentName,
        courseTitle,
        sessionSchedule: session?.scheduleString || "N/A",
        sessionCount:
          session?.totalSessions || session?.sessionCount || 10,
        dob: studentsMap[data.studentId]?.dob || null,
        amount:
          data.amount ||
          data.totalAmount ||
          coursesMap[data.courseId]?.price ||
          0,
      };
    });
  }

  async getEnrollment(id) {
    const doc = await db.collection("enrollment").doc(id).get();
    if (!doc.exists) {
      throw new Error("Enrollment not found");
    }

    const data = doc.data();

    const [userDoc, studentDoc, courseDoc, sessionDoc] = await Promise.all([
      data.parentId ? db.collection("user").doc(data.parentId).get() : Promise.resolve({ exists: false }),
      data.studentId ? db.collection("student").doc(data.studentId).get() : Promise.resolve({ exists: false }),
      data.courseId ? db.collection("courses").doc(data.courseId).get() : Promise.resolve({ exists: false }),
      data.sessionId ? db.collection("session").doc(data.sessionId).get() : Promise.resolve({ exists: false }),
    ]);

    const userData = userDoc.exists ? userDoc.data() : null;
    const studentData = studentDoc.exists ? studentDoc.data() : null;
    const courseData = courseDoc.exists ? courseDoc.data() : null;
    const sessionData = sessionDoc.exists ? sessionDoc.data() : null;

    let sessionSchedule = data.sessionSchedule || "N/A";
    if (sessionData && sessionData.schedule) {
      const scheduleLines = [];
      Object.keys(sessionData.schedule).forEach((day) => {
        scheduleLines.push(`${day}: ${sessionData.schedule[day]}`);
      });
      sessionSchedule = scheduleLines.join(", ");
    }

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
      studentName: studentData?.fullName || studentData?.name || data.studentName || "N/A",
      studentDob: studentData?.dob || null,
      medicalNote: studentData?.medicalNote || "None",
      courseTitle: courseData?.title || courseData?.name || data.courseTitle || "N/A",
      sessionSchedule: sessionSchedule,
      instructorName,
      capacity: sessionData?.capacity || 0,
      numStudent: sessionData?.numStudent || 0,
      totalSessions: sessionData?.totalSessions || 10,
    };
  }

  async cancelEnrollment(enrollmentId) {
    const enrollmentRef = db.collection("enrollment").doc(enrollmentId);
    const doc = await enrollmentRef.get();

    if (!doc.exists) throw new Error("Enrollment not found");

    const data = doc.data();
    if (data.status === "cancelled") throw new Error("Already cancelled");

    await db.runTransaction(async (transaction) => {
      const sessionRef = db.collection("session").doc(data.sessionId);
      const sessionDoc = await transaction.get(sessionRef);

      transaction.update(enrollmentRef, {
        status: "cancelled",
        updatedAt: new Date().toISOString(),
      });

      if (sessionDoc.exists) {
        const currentCount = sessionDoc.data().numStudent || 0;
        if (currentCount > 0) {
          transaction.update(sessionRef, { numStudent: currentCount - 1 });
        }
      }
    });

    return { message: "Enrollment cancelled successfully" };
  }

  async updateEnrollment(enrollmentId, updateData) {
    const enrollmentRef = db.collection("enrollment").doc(enrollmentId);
    const doc = await enrollmentRef.get();

    if (!doc.exists) throw new Error("Enrollment not found");

    const safeData = { ...updateData, updatedAt: new Date().toISOString() };
    delete safeData.id;

    await enrollmentRef.update(safeData);

    return { id: enrollmentId, ...safeData };
  }

  async deleteEnrollment(enrollmentId) {
    const enrollmentRef = db.collection("enrollment").doc(enrollmentId);
    const doc = await enrollmentRef.get();

    if (!doc.exists) throw new Error("Enrollment not found");

    const data = doc.data();

    if (data.status !== "cancelled" && data.status !== "canceled") {
      await db.runTransaction(async (transaction) => {
        const sessionRef = db.collection("session").doc(data.sessionId);
        const sessionDoc = await transaction.get(sessionRef);

        if (sessionDoc.exists) {
          const currentCount = sessionDoc.data().numStudent || 0;
          if (currentCount > 0) {
            transaction.update(sessionRef, { numStudent: currentCount - 1 });
          }
        }
        transaction.delete(enrollmentRef);
      });
    } else {
      await enrollmentRef.delete();
    }

    return { message: "Enrollment deleted permanently" };
  }
}

module.exports = new EnrollmentService();

const { db, COLLECTIONS } = require("../../config/database");

class EnrollmentService {
  async createEnrollment(enrollmentData) {
    const { studentId, programId, sessionId } = enrollmentData;

    if (!studentId || !programId || !sessionId) {
      throw new Error("studentId, programId, and sessionId are required");
    }

    let enrollmentId;
    await db.runTransaction(async (transaction) => {
      const sessionRef = db.collection(COLLECTIONS.SESSION).doc(sessionId);
      const studentRef = db.collection(COLLECTIONS.STUDENT).doc(studentId);
      const programRef = db.collection(COLLECTIONS.PROGRAM).doc(programId);

      const existingEnrollmentQuery = db
        .collection("enrollment")
        .where("studentId", "==", studentId)
        .where("sessionId", "==", sessionId);

      const [sessionDoc, studentDoc, programDoc, existingEnrollmentSnapshot] =
        await Promise.all([
          transaction.get(sessionRef),
          transaction.get(studentRef),
          transaction.get(programRef),
          transaction.get(existingEnrollmentQuery),
        ]);

      if (!sessionDoc.exists) throw new Error("Session not found");
      if (!studentDoc.exists) throw new Error("Student not found");
      if (!programDoc.exists) throw new Error("Program not found");

      if (!existingEnrollmentSnapshot.empty) {
        throw new Error("Student already enrolled for this session");
      }

      const sessionData = sessionDoc.data();
      const programData = programDoc.data();
      if ((sessionData.numStudent || 0) >= sessionData.capacity) {
        throw new Error("Session is full");
      }

      const enrollmentRef = db.collection(COLLECTIONS.ENROLLMENT).doc();
      enrollmentId = enrollmentRef.id;
      const data = {
        studentId,
        sessionId,
        programId,
        parentId: studentDoc.data().parentId, 
        status: "pending",
        paymentStatus: "unpaid",
        amount: programData.price || 0,
        totalAmount: programData.price || 0,
        enrollAt: new Date().toISOString(),
      };

      transaction.set(enrollmentRef, data);

      transaction.update(sessionRef, {
        numStudent: (sessionData.numStudent || 0) + 1,
      });
    });

    return { id: enrollmentId, message: "Enrollment created successfully" };
  }

  async getStudentEligibility(studentId, programId) {
    // Placeholder for eligibility logic
    return { eligible: true, studentId, programId };
  }

  async getAllEnrollments() {
    const [snapshot, usersSnap, studentsSnap, programsSnap, sessionsSnap] = await Promise.all([
      db.collection(COLLECTIONS.ENROLLMENT).get(),
      db.collection(COLLECTIONS.USER).get(),
      db.collection(COLLECTIONS.STUDENT).get(),
      db.collection(COLLECTIONS.PROGRAM).get(),
      db.collection(COLLECTIONS.SESSION).get(),
    ]);

    const usersMap = {};
    usersSnap.forEach((doc) => (usersMap[doc.id] = doc.data()));

    const studentsMap = {};
    studentsSnap.forEach((doc) => (studentsMap[doc.id] = doc.data()));

    const programsMap = {};
    programsSnap.forEach((doc) => (programsMap[doc.id] = doc.data()));

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
      const parentData = usersMap[data.parentId] || {};
      const studentData = studentsMap[data.studentId] || {};
      const programData = programsMap[data.programId] || {};

      const parentName = parentData.name || parentData.email || data.parentName || "N/A";
      const studentName = studentData.fullName || studentData.name || data.studentName || "N/A";
      const programTitle = programData.title || programData.name || data.programTitle || "N/A";

      const parentProfileURL = parentData.profileURL || "N/A";
      const studentProfileURL = studentData.profileURL || "N/A";
      const programProfileURL = programData.profileURL || "N/A";

      const session = sessionsMap[data.sessionId];

      const rStatus = (data.paymentStatus || data.status || "").toLowerCase();
      let displayStatus = "Unpaid";
      if (["paid", "confirmed", "active", "success"].includes(rStatus)) {
        displayStatus = "Paid";
      } else if (["canceled", "cancelled"].includes(rStatus)) {
        displayStatus = "Canceled";
      }

      return {
        id: doc.id,
        ...data,
        parentName,
        parentProfileURL,
        studentName,
        studentProfileURL,
        programTitle,
        programProfileURL,
        displayStatus,
        sessionSchedule: session?.scheduleString || "N/A",
        sessionCount: session?.totalSessions || session?.sessionCount || 10,
        dob: studentData.dob || null,
        amount: data.amount || data.totalAmount || programData.price || 0,
      };
    });
  }

  async getEnrollment(id) {
    const doc = await db.collection(COLLECTIONS.ENROLLMENT).doc(id).get();
    if (!doc.exists) {
      throw new Error("Enrollment not found");
    }

    const data = doc.data();

    const [userDoc, studentDoc, programDoc, sessionDoc] = await Promise.all([
      data.parentId ? db.collection(COLLECTIONS.USER).doc(data.parentId).get() : Promise.resolve({ exists: false }),
      data.studentId ? db.collection(COLLECTIONS.STUDENT).doc(data.studentId).get() : Promise.resolve({ exists: false }),
      data.programId ? db.collection(COLLECTIONS.PROGRAM).doc(data.programId).get() : Promise.resolve({ exists: false }),
      data.sessionId ? db.collection(COLLECTIONS.SESSION).doc(data.sessionId).get() : Promise.resolve({ exists: false }),
    ]);

    const userData = userDoc.exists ? userDoc.data() : null;
    const studentData = studentDoc.exists ? studentDoc.data() : null;
    const programData = programDoc.exists ? programDoc.data() : null;
    const sessionData = sessionDoc.exists ? sessionDoc.data() : null;

    let sessionSchedule = data.sessionSchedule || "N/A";
    if (sessionData && sessionData.schedule) {
      const scheduleLines = [];
      Object.keys(sessionData.schedule).forEach((day) => {
        scheduleLines.push(`${day}: ${sessionData.schedule[day]}`);
      });
      sessionSchedule = scheduleLines.join(", ");
    }

    let teacherName = "Not Assigned";
    if (sessionData && sessionData.teachers && sessionData.teachers.length > 0) {
      const first = sessionData.teachers[0];
      if (first.name) {
        teacherName = first.name;
      } else if (first.id) {
        const instDoc = await db.collection(COLLECTIONS.USER).doc(first.id).get();
        if (instDoc.exists) {
          teacherName = instDoc.data().name || instDoc.data().email || "Assigned";
        }
      }
    }

    const rStatus = (data.paymentStatus || data.status || "").toLowerCase();
    let displayStatus = "Unpaid";
    if (["paid", "confirmed", "active", "success"].includes(rStatus)) {
      displayStatus = "Paid";
    } else if (["canceled", "cancelled"].includes(rStatus)) {
      displayStatus = "Canceled";
    }

    return {
      id: doc.id,
      ...data,
      parentName: userData?.name || userData?.email || data.parentName || "N/A",
      parentEmail: userData?.email || "N/A",
      parentPhone: userData?.phone || "N/A",
      parentRole: userData?.role
        ? userData.role === "parent"
          ? "Parent"
          : userData.role.charAt(0).toUpperCase() + userData.role.slice(1)
        : "Guardian",
      studentName:
        studentData?.fullName || studentData?.name || data.studentName || "N/A",
      studentDob: studentData?.dob || null,
      medicalNote: studentData?.medicalNote || "None",
      programTitle:
        programData?.title || programData?.name || data.programTitle || "N/A",
      displayStatus,
      sessionSchedule: sessionSchedule,
      teacherName,
      capacity: sessionData?.capacity || 0,
      numStudent: sessionData?.numStudent || 0,
      totalSessions: sessionData?.totalSessions || 10,
    };
  }

  async cancelEnrollment(enrollmentId) {
    const enrollmentRef = db.collection(COLLECTIONS.ENROLLMENT).doc(enrollmentId);
    const doc = await enrollmentRef.get();

    if (!doc.exists) throw new Error("Enrollment not found");

    const data = doc.data();
    if (data.status === "cancelled") throw new Error("Already cancelled");

    await db.runTransaction(async (transaction) => {
      const sessionRef = db.collection(COLLECTIONS.SESSION).doc(data.sessionId);
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
    const enrollmentRef = db.collection(COLLECTIONS.ENROLLMENT).doc(enrollmentId);
    const doc = await enrollmentRef.get();

    if (!doc.exists) throw new Error("Enrollment not found");

    const safeData = { ...updateData, updatedAt: new Date().toISOString() };
    delete safeData.id;

    await enrollmentRef.update(safeData);

    return { id: enrollmentId, ...safeData };
  }

  async deleteEnrollment(enrollmentId) {
    const enrollmentRef = db.collection(COLLECTIONS.ENROLLMENT).doc(enrollmentId);
    const doc = await enrollmentRef.get();

    if (!doc.exists) throw new Error("Enrollment not found");

    const data = doc.data();

    if (data.status !== "cancelled" && data.status !== "canceled") {
      await db.runTransaction(async (transaction) => {
        const sessionRef = db.collection(COLLECTIONS.SESSION).doc(data.sessionId);
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

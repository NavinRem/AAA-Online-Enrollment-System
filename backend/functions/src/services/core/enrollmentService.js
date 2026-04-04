const { db, COLLECTIONS } = require("../../config/database");
const userService = require("../management/userService");
const studentService = require("../management/studentService");
const programService = require("../academic/programService");

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
        .collection(COLLECTIONS.ENROLLMENT)
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
        const activeEnrollment = existingEnrollmentSnapshot.docs.find((doc) => {
          const status = (doc.data().status || "").toLowerCase();
          return status !== "cancelled" && status !== "canceled";
        });

        if (activeEnrollment) {
          throw new Error("Student already enrolled for this session");
        }
      }

      const sessionData = sessionDoc.data();
      const studentData = studentDoc.data();
      const programData = programDoc.data();

      // Fetch Parent Data (linked to Student)
      const parentId = studentData.parentId;
      if (!parentId) throw new Error("Student has no parentId linked");
      
      // Use the smart userService lookup instead of the centralized collection
      const parentData = await userService.getUser(parentId);
      if (!parentData) throw new Error("Parent not found in any collection");

      if ((sessionData.numStudent || 0) >= sessionData.capacity) {
        throw new Error("Session is full");
      }

      const enrollmentRef = db.collection(COLLECTIONS.ENROLLMENT).doc();
      enrollmentId = enrollmentRef.id;

      const data = {
        studentId,
        sessionId,
        programId,
        parentId,

        // Snapshot: Parent Information
        parent: userService._getUserSnapshot(parentId, parentData),

        // Snapshot: Student Information
        student: studentService._getStudentSnapshot(studentId, studentData),

        // Snapshot: Program Information
        program: programService._getProgramSnapshot(programId, programData),

        // Snapshot: Session Information
        session: {
          id: sessionId,
          day: sessionData.day || "N/A",
          timeslot: sessionData.timeslot || "N/A",
          capacity: sessionData.capacity || 0,
          numStudent: (sessionData.numStudent || 0) + 1, // Included the new student
          schedule: sessionData.schedule || {},
        },

        status: "pending",
        paymentStatus: "unpaid",
        enrollAt: new Date().toISOString(),
        enrollmentType: enrollmentData.enrollmentType || "Full",
        isProrated: enrollmentData.isProrated || false,
        isSponsorship: enrollmentData.isSponsorship || false,
        sponsorName: enrollmentData.sponsorName || "",
        isCustomPrice: enrollmentData.isCustomPrice || false,
        discountAmount: enrollmentData.discountAmount || 0,
        amount: enrollmentData.amount || programData.price || 0,
        remark: enrollmentData.remark || "",

        // New Calculated Info (Snapshot)
        basePrice: enrollmentData.basePrice || programData.price || 0,
        totalSessions:
          enrollmentData.totalSessions || programData.totalSessions || 0,
        remainingSessions: enrollmentData.remainingSessions || 0,
        passedSessions: enrollmentData.passedSessions || 0,
        prorateSavings: enrollmentData.prorateSavings || 0,
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
    const [snapshot, allUsers, studentsSnap, programsSnap, sessionsSnap] =
      await Promise.all([
        db.collection(COLLECTIONS.ENROLLMENT).get(),
        userService.getAllUsers(),
        db.collection(COLLECTIONS.STUDENT).get(),
        db.collection(COLLECTIONS.PROGRAM).get(),
        db.collection(COLLECTIONS.SESSION).get(),
      ]);

    const usersMap = {};
    allUsers.forEach((u) => (usersMap[u.uid] = u));

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
      const session = sessionsMap[data.sessionId];

      const sStatus = (data.status || "").toLowerCase();
      const pStatus = (data.paymentStatus || "").toLowerCase();
      let displayStatus = "Unpaid";

      if (["canceled", "cancelled"].includes(sStatus)) {
        displayStatus = "Canceled";
      } else if (
        ["paid", "confirmed", "active", "success"].includes(pStatus) ||
        ["active", "confirmed"].includes(sStatus)
      ) {
        displayStatus = "Paid";
      }

      return {
        id: doc.id,
        ...data,
        displayStatus,
        sessionSchedule: session?.scheduleString || "N/A",
        sessionCount: session?.totalSessions || session?.sessionCount || 10,
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

    const [parentData, studentDoc, programDoc, sessionDoc] = await Promise.all([
      data.parentId
        ? userService.getUser(data.parentId).catch(() => null)
        : Promise.resolve(null),
      data.studentId
        ? db.collection(COLLECTIONS.STUDENT).doc(data.studentId).get()
        : Promise.resolve({ exists: false }),
      data.programId
        ? db.collection(COLLECTIONS.PROGRAM).doc(data.programId).get()
        : Promise.resolve({ exists: false }),
      data.sessionId
        ? db.collection(COLLECTIONS.SESSION).doc(data.sessionId).get()
        : Promise.resolve({ exists: false }),
    ]);

    const studentData = studentDoc.exists ? studentDoc.data() : null;
    const programData = programDoc.exists ? programDoc.data() : null;
    const sessionData = sessionDoc.exists ? sessionDoc.data() : null;

    // Resolve all teachers linked to the Program
    let resolvedTeachers = [];
    if (programData?.teachers && programData.teachers.length > 0) {
      resolvedTeachers = await Promise.all(
        programData.teachers.map(async (t) => {
          const tId = t.id || t;
          try {
            return await userService.getUser(tId);
          } catch (err) {
            return { id: tId, name: t.name || "Unassigned" };
          }
        }),
      );
    }

    let sessionSchedule = data.sessionSchedule || "N/A";
    if (sessionData && sessionData.schedule) {
      const scheduleLines = [];
      Object.keys(sessionData.schedule).forEach((day) => {
        scheduleLines.push(`${day}: ${sessionData.schedule[day]}`);
      });
      sessionSchedule = scheduleLines.join(", ");
    }

    let sessionTeachers = [];
    if (sessionData?.teachers && sessionData.teachers.length > 0) {
      sessionTeachers = await Promise.all(
        sessionData.teachers.map(async (t) => {
          const tId = t.id || t;
          try {
            return await userService.getUser(tId);
          } catch (err) {
            return typeof t === "object" ? t : { id: tId, name: "Unassigned" };
          }
        }),
      );
    }

    const sStatus = (data.status || "").toLowerCase();
    const pStatus = (data.paymentStatus || "").toLowerCase();
    let displayStatus = "Unpaid";

    if (["canceled", "cancelled"].includes(sStatus)) {
      displayStatus = "Canceled";
    } else if (
      ["paid", "confirmed", "active", "success"].includes(pStatus) ||
      ["active", "confirmed"].includes(sStatus)
    ) {
      displayStatus = "Paid";
    }

    return {
      id: doc.id,
      ...data,
      displayStatus,
      sessionSchedule,
      parent: parentData
        ? {
            id: data.parentId,
            ...parentData,
            roleDisplay: "Parent",
          }
        : null,
      student: studentData
        ? {
            id: data.studentId,
            ...studentData,
          }
        : null,
      program: programData
        ? {
            id: data.programId,
            ...programData,
            teachers: resolvedTeachers,
          }
        : null,
      session: sessionData
        ? {
            id: data.sessionId,
            ...sessionData,
            teachers: sessionTeachers,
            scheduleString: sessionSchedule,
          }
        : null,
      teacher:
        resolvedTeachers.length > 0
          ? {
              id: resolvedTeachers[0].id,
              ...resolvedTeachers[0],
            }
          : null,
      numberSessions:
        data.remainingSessions ??
        (data.numberSessions || sessionData?.totalSessions || 10),
      amount: data.amount || programData?.price || 0,
    };
  }

  async cancelEnrollment(enrollmentId) {
    const enrollmentRef = db
      .collection(COLLECTIONS.ENROLLMENT)
      .doc(enrollmentId);
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
    const enrollmentRef = db
      .collection(COLLECTIONS.ENROLLMENT)
      .doc(enrollmentId);

    const safeData = { ...updateData, updatedAt: new Date().toISOString() };
    delete safeData.id;

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(enrollmentRef);
      if (!doc.exists) throw new Error("Enrollment not found");

      const oldData = doc.data();
      const oldSessionId = oldData.sessionId;
      const newSessionId = safeData.sessionId || oldSessionId;

      const oldStatus = (oldData.status || "").toLowerCase();
      const newStatus = (safeData.status || oldStatus).toLowerCase();

      const wasActive = !["cancelled", "canceled"].includes(oldStatus);
      const isActive = !["cancelled", "canceled"].includes(newStatus);

      // 1. If session changed
      if (oldSessionId !== newSessionId) {
        // Decrement old if it was active
        if (wasActive && oldSessionId) {
          const oldSessionRef = db
            .collection(COLLECTIONS.SESSION)
            .doc(oldSessionId);
          const oldSessionDoc = await transaction.get(oldSessionRef);
          if (oldSessionDoc.exists) {
            const count = oldSessionDoc.data().numStudent || 0;
            transaction.update(oldSessionRef, {
              numStudent: Math.max(0, count - 1),
            });
          }
        }
        // Increment new if it is active
        if (isActive && newSessionId) {
          const newSessionRef = db
            .collection(COLLECTIONS.SESSION)
            .doc(newSessionId);
          const newSessionDoc = await transaction.get(newSessionRef);
          if (newSessionDoc.exists) {
            const count = newSessionDoc.data().numStudent || 0;
            transaction.update(newSessionRef, { numStudent: count + 1 });
          }
        }
      } else if (wasActive !== isActive) {
        // 2. Session same, but status changed between active/cancelled
        const sessionRef = db.collection(COLLECTIONS.SESSION).doc(oldSessionId);
        const sessionDoc = await transaction.get(sessionRef);
        if (sessionDoc.exists) {
          const count = sessionDoc.data().numStudent || 0;
          if (isActive) {
            // Cancelled -> Active
            transaction.update(sessionRef, { numStudent: count + 1 });
          } else {
            // Active -> Cancelled
            transaction.update(sessionRef, {
              numStudent: Math.max(0, count - 1),
            });
          }
        }
      }

      transaction.update(enrollmentRef, safeData);
    });

    return { id: enrollmentId, ...safeData };
  }

  async deleteEnrollment(enrollmentId) {
    const enrollmentRef = db
      .collection(COLLECTIONS.ENROLLMENT)
      .doc(enrollmentId);
    const doc = await enrollmentRef.get();

    if (!doc.exists) throw new Error("Enrollment not found");

    const data = doc.data();

    if (data.status !== "cancelled" && data.status !== "canceled") {
      await db.runTransaction(async (transaction) => {
        const sessionRef = db
          .collection(COLLECTIONS.SESSION)
          .doc(data.sessionId);
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

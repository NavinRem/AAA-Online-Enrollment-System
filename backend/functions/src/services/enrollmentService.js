const { db, COLLECTIONS } = require("../config/database");
const userService = require("./userService");
const programService = require("./programService");
const profileHelper = require("../utils/profileHelper");

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

        // Snapshot: Parent Information (Mirrored)
        parent: profileHelper.getUserSnapshot(parentId, parentData),

        // Snapshot: Student Information (Mirrored)
        student: profileHelper.getStudentSnapshot(studentId, studentData),

        // Snapshot: Program Information
        program: profileHelper._getProgramSnapshot(programId, programData),

        // Snapshot: Session Information
        session: {
          id: sessionId,
          day: sessionData.day || "N/A",
          timeslot: sessionData.timeslot || "N/A",
          capacity: sessionData.capacity || 0,
          numStudent: (sessionData.numStudent || 0) + 1,
          schedule: sessionData.schedule || {},
        },

        status: "pending",
        paymentStatus: "unpaid",
        enrollAt: new Date().toISOString(),
        enrollmentType: enrollmentData.enrollmentType,
        isProrated: enrollmentData.isProrated,
        isSponsorship: enrollmentData.isSponsorship,
        sponsorName: enrollmentData.sponsorName,
        isCustomPrice: enrollmentData.isCustomPrice,
        discountAmount: enrollmentData.discountAmount,
        amount: enrollmentData.amount,
        remark: enrollmentData.remark,
        basePrice: enrollmentData.basePrice,
        totalSessions: enrollmentData.totalSessions,
        remainingSessions: enrollmentData.remainingSessions,
        passedSessions: enrollmentData.passedSessions,
        prorateSavings: enrollmentData.prorateSavings,
      };

      transaction.set(enrollmentRef, data);

      transaction.update(sessionRef, {
        numStudent: (sessionData.numStudent || 0) + 1,
      });
    });

    return { id: enrollmentId, message: "Enrollment created successfully" };
  }

  /**
   * Optimized: Uses mirrored snapshots instead of massive cross-collection fetches
   */
  async getAllEnrollments() {
    const [snapshot, programsSnap, sessionsSnap] = await Promise.all([
      db.collection(COLLECTIONS.ENROLLMENT).get(),
      db.collection(COLLECTIONS.PROGRAM).get(),
      db.collection(COLLECTIONS.SESSION).get(),
    ]);

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
      const programData = programsMap[data.programId] || {};
      const session = sessionsMap[data.sessionId];

      // Computed Status
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
    if (!doc.exists) throw new Error("Enrollment not found");

    const data = doc.data();

    // Fetch live data for detail refresh (optional but recommended for Detail views)
    const [programDoc, sessionDoc] = await Promise.all([
      data.programId
        ? db.collection(COLLECTIONS.PROGRAM).doc(data.programId).get()
        : Promise.resolve({ exists: false }),
      data.sessionId
        ? db.collection(COLLECTIONS.SESSION).doc(data.sessionId).get()
        : Promise.resolve({ exists: false }),
    ]);

    const programData = programDoc.exists ? programDoc.data() : null;
    const sessionData = sessionDoc.exists ? sessionDoc.data() : null;

    // Resolve teachers
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
    if (sessionData?.schedule) {
      const scheduleLines = [];
      Object.keys(sessionData.schedule).forEach((day) => {
        scheduleLines.push(`${day}: ${sessionData.schedule[day]}`);
      });
      sessionSchedule = scheduleLines.join(", ");
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
      program: programData
        ? { id: data.programId, ...programData, teachers: resolvedTeachers }
        : null,
      session: sessionData
        ? {
            id: data.sessionId,
            ...sessionData,
            scheduleString: sessionSchedule,
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

      if (oldSessionId !== newSessionId) {
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
        const sessionRef = db.collection(COLLECTIONS.SESSION).doc(oldSessionId);
        const sessionDoc = await transaction.get(sessionRef);
        if (sessionDoc.exists) {
          const count = sessionDoc.data().numStudent || 0;
          if (isActive) {
            transaction.update(sessionRef, { numStudent: count + 1 });
          } else {
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

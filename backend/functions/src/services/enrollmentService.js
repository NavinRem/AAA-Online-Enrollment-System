const { db, COLLECTIONS } = require("../config/database");
const userService = require("./userService");
const programService = require("./programService");
const profileHelper = require("../utils/profileHelper");
const branchService = require("./branchService");

class EnrollmentService {
  async createEnrollment(enrollmentData) {
    const { studentId, programId, classId } = enrollmentData;

    if (!studentId || !programId || !classId) {
      throw new Error("studentId, programId, and classId are required");
    }

    let enrollmentId;
    await db.runTransaction(async (transaction) => {
      const classRef = db.collection(COLLECTIONS.CLASS).doc(classId);
      const studentRef = db.collection(COLLECTIONS.STUDENT).doc(studentId);
      const programRef = db.collection(COLLECTIONS.PROGRAM).doc(programId);

      const existingEnrollmentQuery = db
        .collection(COLLECTIONS.ENROLLMENT)
        .where("studentId", "==", studentId)
        .where("classId", "==", classId);

      const [classDoc, studentDoc, programDoc, existingEnrollmentSnapshot] =
        await Promise.all([
          transaction.get(classRef),
          transaction.get(studentRef),
          transaction.get(programRef),
          transaction.get(existingEnrollmentQuery),
        ]);

      if (!classDoc.exists) throw new Error("Class instance not found");
      if (!studentDoc.exists) throw new Error("Student not found");
      if (!programDoc.exists) throw new Error("Program model not found");

      if (!existingEnrollmentSnapshot.empty) {
        const activeEnrollment = existingEnrollmentSnapshot.docs.find((doc) => {
          const status = (doc.data().status || "").toLowerCase();
          return status !== "cancelled" && status !== "canceled";
        });

        if (activeEnrollment) {
          throw new Error("Student already enrolled for this class instance");
        }
      }

      const classData = classDoc.data();
      const studentData = studentDoc.data();
      const programData = programDoc.data();

      // Fetch Parent Data (linked to Student)
      const parentId = studentData.parentId;
      if (!parentId) throw new Error("Student has no parentId linked");

      const parentData = await userService.getUser(parentId);
      if (!parentData) throw new Error("Parent not found in any collection");

      if (
        (classData.numStudent || 0) >=
        (classData.capacity || programData.maxCapacity)
      ) {
        throw new Error("Class is at full capacity");
      }

      const enrollmentRef = db.collection(COLLECTIONS.ENROLLMENT).doc();
      enrollmentId = enrollmentRef.id;

      const data = {
        studentId,
        classId,
        programId,

        parentId,

        // Snapshot: Parent Information (Mirrored)
        parent: profileHelper.getUserSnapshot(parentId, parentData),

        // Snapshot: Student Information (Mirrored)
        student: profileHelper.getStudentSnapshot(studentId, studentData),

        // Snapshot: Program Information
        program: profileHelper.getProgramSnapshot(programId, programData),

        // Snapshot: Class Information (Mirrored)
        class: profileHelper.getClassSnapshot(classId, {
          ...classData,
          numStudent: (classData.numStudent || 0) + 1,
        }),

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
        basePrice: enrollmentData.basePrice || programData.basePrice,
        totalSessions:
          enrollmentData.totalSessions || programData.sessionNumber,
        remainingSessions:
          enrollmentData.remainingSessions || programData.sessionNumber,
        passedSessions: enrollmentData.passedSessions || 0,
        numberSessions: enrollmentData.isProrated
          ? enrollmentData.remainingSessions || programData.sessionNumber
          : enrollmentData.totalSessions || programData.sessionNumber,
        prorateSavings: enrollmentData.prorateSavings || 0,
        branchId: classData.branchId || null,
        branch: classData.branch || null,
        term: classData.term || null,
      };

      transaction.set(enrollmentRef, data);

      transaction.update(classRef, {
        numStudent: (classData.numStudent || 0) + 1,
      });
    });

    if (enrollmentId) {
      const enrollmentDoc = await db
        .collection(COLLECTIONS.ENROLLMENT)
        .doc(enrollmentId)
        .get();
      const bId = enrollmentDoc.data()?.branchId;
      if (bId) await branchService.calculateAndSyncStats(bId);
    }

    return { id: enrollmentId, message: "Enrollment created successfully" };
  }

  /**
   * Optimized: Uses mirrored snapshots instead of massive cross-collection fetches
   */
  async getAllEnrollments() {
    const [snapshot, programsSnap, classesSnap] = await Promise.all([
      db.collection(COLLECTIONS.ENROLLMENT).get(),
      db.collection(COLLECTIONS.PROGRAM).get(),
      db.collection(COLLECTIONS.CLASS).get(),
    ]);

    const programsMap = {};
    programsSnap.forEach((doc) => (programsMap[doc.id] = doc.data()));

    const classesMap = {};
    classesSnap.forEach((doc) => {
      const c = doc.data();
      classesMap[doc.id] = {
        ...c,
        scheduleString: `${c.day}: ${c.timeslot}`,
      };
    });

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      const programData = programsMap[data.programId] || {};
      const classInstance = classesMap[data.classId];

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
        classSchedule: classInstance?.scheduleString || "N/A",
        sessionCount:
          classInstance?.sessionNumber || programData?.sessionNumber || 10,
        amount: data.amount || data.totalAmount || programData.basePrice || 0,
      };
    });
  }

  async getEnrollment(id) {
    const doc = await db.collection(COLLECTIONS.ENROLLMENT).doc(id).get();
    if (!doc.exists) throw new Error("Enrollment not found");

    const data = doc.data();

    // Fetch live data for detail refresh
    const [programDoc, classDoc] = await Promise.all([
      data.programId
        ? db.collection(COLLECTIONS.PROGRAM).doc(data.programId).get()
        : Promise.resolve({ exists: false }),
      data.classId
        ? db.collection(COLLECTIONS.CLASS).doc(data.classId).get()
        : Promise.resolve({ exists: false }),
    ]);

    const programData = programDoc.exists ? programDoc.data() : null;
    const classData = classDoc.exists ? classDoc.data() : null;

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

    let classSchedule = data.classSchedule || "N/A";
    if (classData) {
      classSchedule = `${classData.day}: ${classData.timeslot}`;
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
      classSchedule,
      program: programData
        ? { id: data.programId, ...programData, teachers: resolvedTeachers }
        : null,
      class: classData
        ? {
            id: data.classId,
            ...classData,
            scheduleString: classSchedule,
          }
        : null,
      numberSessions:
        data.remainingSessions ??
        (data.numberSessions || programData?.sessionNumber || 10),
      amount: data.amount || programData?.basePrice || 0,
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
      const classRef = db.collection(COLLECTIONS.CLASS).doc(data.classId);
      const classDoc = await transaction.get(classRef);

      transaction.update(enrollmentRef, {
        status: "cancelled",
        updatedAt: new Date().toISOString(),
      });

      if (classDoc.exists) {
        const currentCount = classDoc.data().numStudent || 0;
        if (currentCount > 0) {
          transaction.update(classRef, { numStudent: currentCount - 1 });
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
      const oldClassId = oldData.classId;
      const newClassId = safeData.classId || oldClassId;

      const oldStatus = (oldData.status || "").toLowerCase();
      const newStatus = (safeData.status || oldStatus).toLowerCase();

      const wasActive = !["cancelled", "canceled"].includes(oldStatus);
      const isActive = !["cancelled", "canceled"].includes(newStatus);

      if (oldClassId !== newClassId) {
        if (wasActive && oldClassId) {
          const oldClassRef = db.collection(COLLECTIONS.CLASS).doc(oldClassId);
          const oldClassDoc = await transaction.get(oldClassRef);
          if (oldClassDoc.exists) {
            const count = oldClassDoc.data().numStudent || 0;
            transaction.update(oldClassRef, {
              numStudent: Math.max(0, count - 1),
            });
          }
        }
        if (isActive && newClassId) {
          const newClassRef = db.collection(COLLECTIONS.CLASS).doc(newClassId);
          const newClassDoc = await transaction.get(newClassRef);
          if (newClassDoc.exists) {
            const count = newClassDoc.data().numStudent || 0;
            transaction.update(newClassRef, { numStudent: count + 1 });
          }
        }
      } else if (wasActive !== isActive) {
        const classRef = db.collection(COLLECTIONS.CLASS).doc(oldClassId);
        const classDoc = await transaction.get(classRef);
        if (classDoc.exists) {
          const count = classDoc.data().numStudent || 0;
          if (isActive) {
            transaction.update(classRef, { numStudent: count + 1 });
          } else {
            transaction.update(classRef, {
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
        const classRef = db.collection(COLLECTIONS.CLASS).doc(data.classId);
        const classDoc = await transaction.get(classRef);

        if (classDoc.exists) {
          const currentCount = classDoc.data().numStudent || 0;
          if (currentCount > 0) {
            transaction.update(classRef, { numStudent: currentCount - 1 });
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

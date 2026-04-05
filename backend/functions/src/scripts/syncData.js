const admin = require("firebase-admin");
const { COLLECTIONS } = require("../config/database");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

const userService = require("../services/userService");
const studentService = require("../services/studentService");
const programService = require("../services/programService");

async function syncAllData() {
  console.log("🚀 Starting Unified Data Standardization & Mirroring Sync...");

  const userMap = {};
  const studentMap = {};
  const programMap = {};
  let processedCount = 0;

  try {
    console.log("--- 1a/4 Standardizing Parents ---");
    const parentsSnap = await db.collection(COLLECTIONS.PARENT).get();
    for (const doc of parentsSnap.docs) {
      const data = doc.data();
      const uid = doc.id;
      const snapshot = userService._getUserSnapshot(uid, {
        ...data,
        role: "parent",
      });
      userMap[uid] = snapshot;

      const cleanData = {
        ...data,
        ...snapshot,
        role: "parent",
        updatedAt: new Date().toISOString(),
      };
      delete cleanData.profile;
      await doc.ref.set(cleanData, { merge: true });
      processedCount++;
    }

    // 2. Process & Standardize Staff
    console.log("--- 1b/4 Standardizing Staff (Users Collection) ---");
    const staffSnap = await db.collection(COLLECTIONS.USER).get();
    for (const doc of staffSnap.docs) {
      const data = doc.data();
      const uid = doc.id;
      const role = (data.role || "teacher").toLowerCase();
      const snapshot = userService._getUserSnapshot(uid, { ...data, role });
      userMap[uid] = snapshot;

      const cleanData = {
        ...data,
        ...snapshot,
        role,
        updatedAt: new Date().toISOString(),
      };
      delete cleanData.profile;
      await doc.ref.set(cleanData, { merge: true });
      processedCount++;
    }

    console.log("--- 2/4 Standardizing Students ---");
    const studentsSnap = await db.collection(COLLECTIONS.STUDENT).get();
    for (const doc of studentsSnap.docs) {
      const data = doc.data();
      const sid = doc.id;
      const snapshot = studentService._getStudentSnapshot(sid, data);
      studentMap[sid] = snapshot;

      const cleanData = {
        ...data,
        ...snapshot,
        updatedAt: new Date().toISOString(),
      };
      delete cleanData.profile;

      if (data.parentId && userMap[data.parentId]) {
        cleanData.parentInfo = userMap[data.parentId];
      }

      await doc.ref.set(cleanData, { merge: true });
      processedCount++;
    }

    console.log("--- 3/4 Standardizing Programs ---");
    const programsSnap = await db.collection(COLLECTIONS.PROGRAM).get();
    for (const doc of programsSnap.docs) {
      const data = doc.data();
      const pid = doc.id;
      const snapshot = programService._getProgramSnapshot(pid, data);
      programMap[pid] = snapshot;

      const cleanData = {
        ...data,
        ...snapshot,
        updatedAt: new Date().toISOString(),
      };
      delete cleanData.profile;

      if (data.numberSessions) {
        cleanData.totalSessions = data.numberSessions;
        delete cleanData.numberSessions;
      }

      await doc.ref.set(cleanData, { merge: true });
      processedCount++;
    }

    console.log("--- 4/4 Syncing Enrollments ---");
    const enrollmentsSnap = await db.collection(COLLECTIONS.ENROLLMENT).get();
    for (const doc of enrollmentsSnap.docs) {
      const eData = doc.data();
      const updates = {};

      if (eData.parentId && userMap[eData.parentId])
        updates.parent = userMap[eData.parentId];
      if (eData.studentId && studentMap[eData.studentId])
        updates.student = studentMap[eData.studentId];
      if (eData.programId && programMap[eData.programId])
        updates.program = programMap[eData.programId];

      if (Object.keys(updates).length > 0) {
        await doc.ref.update(updates);
      }
      processedCount++;
    }

    console.log("✅ UNIFIED DATA SYNC COMPLETED SUCCESSFULLY!");
    console.log(`Summary: Processed ${processedCount} entities.`);
  } catch (err) {
    console.error("❌ Sync failed:", err);
  }
}

if (require.main === module) {
  syncAllData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = syncAllData;

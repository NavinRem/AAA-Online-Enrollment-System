// 1. Environment Configuration (Must be FIRST for Emulator)
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const profileHelper = require("../utils/profileHelper");

// Use INTERNAL_ env vars directly (NO FALLBACKS as requested)
process.env.GCLOUD_PROJECT = process.env.INTERNAL_PROJECT_ID;
process.env.FIRESTORE_EMULATOR_HOST =
  process.env.INTERNAL_FIRESTORE_EMULATOR_HOST;
process.env.FIREBASE_AUTH_EMULATOR_HOST =
  process.env.INTERNAL_AUTH_EMULATOR_HOST;

if (!process.env.GCLOUD_PROJECT || !process.env.FIRESTORE_EMULATOR_HOST) {
  console.error(
    "❌ Error: Missing required INTERNAL_ environment variables in .env",
  );
  process.exit(1);
}

console.log(
  `📍 Connecting to Emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`,
);

const admin = require("firebase-admin");

// 2. App Initialization
if (admin.apps.length === 0) {
  if (!process.env.INTERNAL_STORAGE_BUCKET) {
    console.error("❌ Error: Missing INTERNAL_STORAGE_BUCKET in .env");
    process.exit(1);
  }
  admin.initializeApp({
    projectId: process.env.GCLOUD_PROJECT,
    storageBucket: process.env.INTERNAL_STORAGE_BUCKET,
  });
}

const db = admin.firestore();

// 3. Service Imports
const { COLLECTIONS } = require("../config/database");
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
      const snapshot = profileHelper.getUserSnapshot(uid, {
        ...data,
        role: "parent",
      });
      userMap[uid] = snapshot;

      const cleanData = {
        ...data,
        ...snapshot,
        role: "parent",
        roleDisplay: admin.firestore.FieldValue.delete(), // Explicitly delete
        profile: admin.firestore.FieldValue.delete(),     // Explicitly delete
        updatedAt: new Date().toISOString(),
      };
      await doc.ref.set(cleanData, { merge: true });
      processedCount++;
    }

    // 2. Process & Standardize Staff
    console.log("--- 1b/4 Standardizing Staff (Admins Collection) ---");
    const staffSnap = await db.collection(COLLECTIONS.ADMIN).get();
    for (const doc of staffSnap.docs) {
      const data = doc.data();
      const uid = doc.id;
      const role = (data.role || "teacher").toLowerCase();
      const snapshot = profileHelper.getUserSnapshot(uid, { ...data, role });
      userMap[uid] = snapshot;

      const cleanData = {
        ...data,
        ...snapshot,
        role,
        roleDisplay: admin.firestore.FieldValue.delete(), // Explicitly delete
        profile: admin.firestore.FieldValue.delete(),     // Explicitly delete
        updatedAt: new Date().toISOString(),
      };
      await doc.ref.set(cleanData, { merge: true });
      processedCount++;
    }

    console.log("--- 2/4 Standardizing Students ---");
    const studentsSnap = await db.collection(COLLECTIONS.STUDENT).get();
    for (const doc of studentsSnap.docs) {
      const data = doc.data();
      const sid = doc.id;
      const snapshot = profileHelper.getStudentSnapshot(sid, data);
      studentMap[sid] = snapshot;

      const cleanData = {
        ...data,
        ...snapshot,
        profile: admin.firestore.FieldValue.delete(), // Explicitly delete
        updatedAt: new Date().toISOString(),
      };

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
      const snapshot = profileHelper.getProgramSnapshot(pid, data);
      programMap[pid] = snapshot;

      const cleanData = {
        ...data,
        ...snapshot,
        profile: admin.firestore.FieldValue.delete(), // Explicitly delete
        updatedAt: new Date().toISOString(),
      };

      if (data.numberSessions) {
        cleanData.totalSessions = data.numberSessions;
        cleanData.numberSessions = admin.firestore.FieldValue.delete(); // Explicitly delete
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
      if (eData.teacherId && userMap[eData.teacherId])
        updates.teacher = userMap[eData.teacherId];

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

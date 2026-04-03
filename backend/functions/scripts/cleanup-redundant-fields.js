const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");

// Initialize Firebase Admin
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

// Standard Collections (Update these if your database.js uses different names)
const COLLECTIONS = {
  STUDENT: "students",
  PARENT: "parents",
  GUARDIAN: "guardians",
  ADMIN: "admins",
  TEACHER: "teachers",
  ENROLLMENT: "enrollments",
  PROGRAM: "programs"
};

async function cleanup() {
  console.log("🚀 Starting Final Database Purge & Standardization...");

  const batch = db.batch();
  let count = 0;
  let totalRemoved = 0;

  // 1. CLEANUP STUDENTS
  console.log("🧹 Cleaning up 'students' collection...");
  const studentsSnap = await db.collection(COLLECTIONS.STUDENT).get();
  for (const doc of studentsSnap.docs) {
    const data = doc.id ? doc.data() : {};
    const updates = {};
    
    // Ensure standardized fields exist
    if (data.fullName && !data.name) updates.name = data.fullName;
    if ((data.profileURL || data.childProfileURL) && !data.profile) {
      updates.profile = data.profileURL || data.childProfileURL;
    }

    // Unset legacy fields
    updates.fullName = FieldValue.delete();
    updates.profileURL = FieldValue.delete();
    updates.childProfileURL = FieldValue.delete();
    updates.parentName = FieldValue.delete();
    updates.parentProfile = FieldValue.delete();
    updates.id = FieldValue.delete(); // We use doc.id

    batch.update(doc.ref, updates);
    count++;
    totalRemoved++;

    if (count >= 400) {
      await batch.commit();
      console.log(`📉 Committed partial batch (${totalRemoved} docs)...`);
      count = 0;
    }
  }

  // 2. CLEANUP USERS (Parents, Guardians, Admins, Teachers)
  const userCollections = [COLLECTIONS.PARENT, COLLECTIONS.GUARDIAN, COLLECTIONS.ADMIN, COLLECTIONS.TEACHER];
  for (const col of userCollections) {
    console.log(`🧹 Cleaning up '${col}' collection...`);
    const snap = await db.collection(col).get();
    for (const doc of snap.docs) {
      const data = doc.data();
      const updates = {};

      if (data.fullName && !data.name) updates.name = data.fullName;
      if (data.username && !data.name) updates.name = data.username;
      if (data.profileURL && !data.profile) updates.profile = data.profileURL;

      updates.fullName = FieldValue.delete();
      updates.username = FieldValue.delete();
      updates.profileURL = FieldValue.delete();
      updates.children = FieldValue.delete();
      updates.studentProfiles = FieldValue.delete();

      batch.update(doc.ref, updates);
      count++;
      totalRemoved++;

      if (count >= 400) {
        await batch.commit();
        console.log(`📉 Committed partial batch (${totalRemoved} docs)...`);
        count = 0;
      }
    }
  }

  // 3. CLEANUP ENROLLMENTS
  console.log("🧹 Cleaning up 'enrollments' collection...");
  const enrollmentsSnap = await db.collection(COLLECTIONS.ENROLLMENT).get();
  for (const doc of enrollmentsSnap.docs) {
    const data = doc.data();
    const updates = {};

    // Remove all legacy flat fields as we now use nested snapshots
    updates.parentName = FieldValue.delete();
    updates.parentProfileURL = FieldValue.delete();
    updates.studentName = FieldValue.delete();
    updates.studentProfileURL = FieldValue.delete();
    updates.programTitle = FieldValue.delete();
    updates.programProfileURL = FieldValue.delete();
    updates.programCategory = FieldValue.delete();
    updates.courseTitle = FieldValue.delete();
    updates.courseId = FieldValue.delete();
    updates.teacherName = FieldValue.delete();
    updates.teacherProfileURL = FieldValue.delete();

    batch.update(doc.ref, updates);
    count++;
    totalRemoved++;

    if (count >= 400) {
      await batch.commit();
      console.log(`📉 Committed partial batch (${totalRemoved} docs)...`);
      count = 0;
    }
  }

  // 4. CLEANUP PROGRAMS
  console.log("🧹 Cleaning up 'programs' collection...");
  const programsSnap = await db.collection(COLLECTIONS.PROGRAM).get();
  for (const doc of programsSnap.docs) {
    const data = doc.data();
    const updates = {};
    
    if (data.profileURL && !data.profile) updates.profile = data.profileURL;
    updates.profileURL = FieldValue.delete();

    batch.update(doc.ref, updates);
    count++;
    totalRemoved++;
  }

  if (count > 0) {
    await batch.commit();
  }

  console.log(`🏁 Cleanup completed successfully! Total documents updated/cleaned: ${totalRemoved}`);
}

cleanup().catch(err => {
  console.error("❌ Cleanup failed:", err);
  process.exit(1);
});

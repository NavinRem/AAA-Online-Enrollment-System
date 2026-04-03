const admin = require("firebase-admin");
const path = require("path");

// Initialize Firebase Admin
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const { db, COLLECTIONS } = require("../src/config/database");

/**
 * Robust Snapshot Helpers
 * Handles 'profile' and 'profileURL' legacy fields with default fallbacks
 */
const getParentSnapshot = (parentId, userData) => {
  const profile = userData.profile || userData.profileURL || "/src/assets/images/profiles/avatar-man.png";
  return {
    id: parentId,
    name: userData.name || userData.email || "Parent",
    email: userData.email || "N/A",
    phone: userData.phone || "N/A",
    role: userData.role || "guardian",
    roleDisplay: userData.role === "parent" ? "Parent" : userData.role || "Guardian",
    profile: profile,
  };
};

const getStudentSnapshot = (studentId, studentData) => {
  const profile = studentData.profile || studentData.profileURL || studentData.childProfileURL || "/src/assets/images/profiles/avatar-boy.png";
  return {
    id: studentId,
    name: studentData.fullName || studentData.name || "Student",
    dob: studentData.dob || null,
    medicalNote: studentData.medicalNote || "",
    profile: profile,
  };
};

async function migrate() {
  console.log("🚀 Starting Mirror Info Migration (v3 - Profile & Default Fixes)...");

  // 1. Fetch all data
  console.log("📦 Fetching students, parents, and guardians...");
  const [studentsSnap, parentsSnap, guardiansSnap] = await Promise.all([
    db.collection(COLLECTIONS.STUDENT).get(),
    db.collection(COLLECTIONS.PARENT).get(),
    db.collection(COLLECTIONS.GUARDIAN).get(),
  ]);

  const userMap = {}; // id -> data
  parentsSnap.forEach(doc => userMap[doc.id] = { ...doc.data(), collection: COLLECTIONS.PARENT });
  guardiansSnap.forEach(doc => userMap[doc.id] = { ...doc.data(), collection: COLLECTIONS.GUARDIAN });

  console.log(`✅ Loaded ${studentsSnap.size} students and ${Object.keys(userMap).length} users.`);

  const batch = db.batch();
  let count = 0;

  // 2. Process Students -> Add parentInfo & Fix own profile
  console.log("🔄 Processing students for parentInfo and profile standardization...");
  for (const doc of studentsSnap.docs) {
    const sId = doc.id;
    const sData = doc.data();
    const pId = sData.parentId;

    const updates = {};
    
    // Fix student's own profile if it's in profileURL or childProfileURL
    if (!sData.profile) {
      updates.profile = sData.profileURL || sData.childProfileURL || "/src/assets/images/profiles/avatar-boy.png";
    }

    if (pId && userMap[pId]) {
      const parentInfo = getParentSnapshot(pId, userMap[pId]);
      updates.parentInfo = parentInfo;
      updates.parentName = parentInfo.name; // Support legacy
      updates.parentProfile = parentInfo.profile; // Support legacy

      const sRef = db.collection(COLLECTIONS.STUDENT).doc(sId);
      batch.update(sRef, updates);

      // Also update parent's sub-collection
      const pCol = userMap[pId].collection;
      const subRef = db.collection(pCol).doc(pId).collection("students").doc(sId);
      
      const fullSData = { ...sData, ...updates };
      batch.set(subRef, fullSData, { merge: true });
      count += 2;
    }

    if (count >= 400) {
      await batch.commit();
      console.log(`📉 Committed partial batch...`);
      count = 0;
    }
  }

  // 3. Process Parents/Guardians -> Add studentInfo & Fix own profile
  console.log("🔄 Processing parents for studentInfo and profile standardization...");
  for (const uId in userMap) {
    const uData = userMap[uId];
    const pCol = uData.collection;
    const uRef = db.collection(pCol).doc(uId);

    const updates = {};
    
    // Fix parent's own profile
    if (!uData.profile) {
      updates.profile = uData.profileURL || "/src/assets/images/profiles/avatar-man.png";
    }

    // Snapshot students
    const myStudents = studentsSnap.docs
      .filter(doc => doc.data().parentId === uId)
      .map(doc => {
        return getStudentSnapshot(doc.id, doc.data());
      });

    if (myStudents.length >= 0) {
      updates.studentInfo = myStudents;
      // Update legacy children array with full names
      updates.children = myStudents.map(s => ({ id: s.id, name: s.name }));
    }

    if (Object.keys(updates).length > 0) {
      batch.update(uRef, updates);
      count++;
    }

    if (count >= 400) {
      await batch.commit();
      console.log(`📉 Committed partial batch...`);
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
  }

  console.log("🏁 Migration v3 completed successfully!");
}

migrate().catch(err => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});

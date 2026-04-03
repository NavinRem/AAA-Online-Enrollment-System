const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");

// Initialize Firebase Admin if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

const COLLECTIONS = {
  USER: "users",
  PARENT: "parents",
  GUARDIAN: "guardians",
  ADMIN: "admins",
  TEACHER: "teachers",
  STUDENT: "students"
};

async function migrate() {
  console.log("🚀 Starting Identity Consolidation (Legacy users -> Role Collections)...");

  const usersSnap = await db.collection(COLLECTIONS.USER).get();
  console.log(`🔍 Found ${usersSnap.size} documents in legacy 'users' collection.`);

  let migratedCount = 0;
  let batch = db.batch();
  let count = 0;

  for (const doc of usersSnap.docs) {
    const data = doc.data();
    const uid = doc.id;
    const role = (data.role || "parent").toLowerCase();

    // 1. Determine target collection
    let targetCollection;
    if (role === "admin") targetCollection = COLLECTIONS.ADMIN;
    else if (role === "teacher" || role === "instructor") targetCollection = COLLECTIONS.TEACHER;
    else if (role === "guardian") targetCollection = COLLECTIONS.GUARDIAN;
    else targetCollection = COLLECTIONS.PARENT;

    // 2. Standardize fields (Cleaning the "Messy" code fallbacks)
    const cleanData = {
      ...data,
      name: data.name || data.fullName || data.username || "User",
      profile: data.profile || data.profileURL || "/src/assets/images/profiles/avatar-man.png",
      updatedAt: new Date().toISOString()
    };

    // Remove legacy names to keep the console clean
    delete cleanData.fullName;
    delete cleanData.username;
    delete cleanData.profileURL;
    delete cleanData.childProfileURL;
    delete cleanData.id;

    // 3. Prepare Update
    const targetRef = db.collection(targetCollection).doc(uid);
    batch.set(targetRef, cleanData, { merge: true });
    
    migratedCount++;
    count++;

    if (count >= 400) {
      await batch.commit();
      console.log(`📉 Committed migration batch (${migratedCount} users)...`);
      batch = db.batch();
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
  }

  console.log(`✅ Successfully mirrored ${migratedCount} users to their role-specific collections.`);
  
  // 4. Mirroring to Students (Cleanup parentInfo snapshots)
  console.log("✨ Synchronizing parentInfo snapshots in 'students' collection...");
  const studentsSnap = await db.collection(COLLECTIONS.STUDENT).get();
  batch = db.batch();
  count = 0;

  for (const sDoc of studentsSnap.docs) {
    const sData = sDoc.data();
    const parentId = sData.parentId;
    if (!parentId) continue;

    const parentDoc = await db.collection(COLLECTIONS.PARENT).doc(parentId).get();
    const guardianDoc = !parentDoc.exists ? await db.collection(COLLECTIONS.GUARDIAN).doc(parentId).get() : null;
    
    const pData = parentDoc.exists ? parentDoc.data() : (guardianDoc?.exists ? guardianDoc.data() : null);

    if (pData) {
      const parentInfo = {
        id: parentId,
        name: pData.name || pData.email || "Parent",
        email: pData.email || "N/A",
        phone: pData.phone || "N/A",
        role: pData.role || "guardian",
        roleDisplay: pData.role === "parent" ? "Parent" : (pData.role || "Guardian"),
        profile: pData.profile || "/src/assets/images/profiles/avatar-man.png",
      };

      batch.update(sDoc.ref, { parentInfo });
      count++;
    }

    if (count >= 400) {
      await batch.commit();
      batch = db.batch();
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
  }

  console.log("🏁 Migration and Standardization complete!");
  console.log("⚠️  You can now safely delete the 'users' collection after verifying the data.");
}

migrate().catch(console.error);

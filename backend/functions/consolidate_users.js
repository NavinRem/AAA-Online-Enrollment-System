const admin = require("firebase-admin");

// Initialize Admin SDK - Assumes environment has credentials (like the emulator)
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const auth = admin.auth();

const COLLECTIONS = {
  USER: "users",
  PARENT: "parents",
  GUARDIAN: "guardians",
  ADMIN: "admins",
  TEACHER: "teachers",
};

async function migrate() {
  const sourceCollections = [
    { name: COLLECTIONS.PARENT, role: "parent" },
    { name: COLLECTIONS.GUARDIAN, role: "parent" }, // Explicit merge to 'parent'
    { name: COLLECTIONS.ADMIN, role: "admin" },
    { name: COLLECTIONS.TEACHER, role: "teacher" }
  ];

  console.log("🚀 Starting Unified User Consolidation (Merge Guardian -> Parent)...");
  let totalMoved = 0;

  for (const source of sourceCollections) {
    const snap = await db.collection(source.name).get();
    if (snap.empty) {
      console.log(`ℹ️ Collection '${source.name}' is empty.`);
      continue;
    }

    console.log(`📦 Found ${snap.size} documents in '${source.name}'`);

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const uid = docSnap.id;
      
      // Determine target role (Guardian becomes Parent)
      const targetRole = source.role;

      // 1. Prepare Unified User Document
      const unifiedData = {
        ...data,
        role: targetRole,
        migratedFrom: source.name,
        migratedAt: new Date().toISOString()
      };

      // 2. Set in unified 'users' collection
      await db.collection(COLLECTIONS.USER).doc(uid).set(unifiedData, { merge: true });

      // 3. Update Custom Claims in Firebase Auth (Source of truth for security)
      try {
        await auth.setCustomUserClaims(uid, { role: targetRole });
      } catch (authErr) {
        console.warn(`  ⚠️ Could not update custom claims for ${uid}:`, authErr.message);
      }

      console.log(`  ✅ Consolidated ${uid} as '${targetRole}' (from ${source.name})`);
      totalMoved++;
    }
  }

  console.log(`\n🎉 Consolidation Complete!`);
  console.log(`Total users moved to '${COLLECTIONS.USER}': ${totalMoved}`);
}

migrate()
  .then(() => {
    console.log("Exiting...");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Fatal Error during migration:", err);
    process.exit(1);
  });

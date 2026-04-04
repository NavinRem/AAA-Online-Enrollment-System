const admin = require("firebase-admin");
const { db, COLLECTIONS } = require("../config/database");

/**
 * Script to seed the first Administrator account.
 * This should be run ONCE after a fresh system wipe.
 */
async function seedAdmin() {
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";

  if (admin.apps.length === 0) {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }

  const adminData = {
    email: process.env.INITIAL_ADMIN_EMAIL,
    password: process.env.INITIAL_ADMIN_PASSWORD,
    name: process.env.INITIAL_ADMIN_NAME,
    role: "admin",
    status: "Active",
  };

  console.log(`🛡️ Initializing Admin account: ${adminData.email}...`);

  try {
    // 1. Create Auth User
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(adminData.email);
      console.log("ℹ️ Admin user already exists in Auth. Updating claims...");
    } catch (err) {
      userRecord = await admin.auth().createUser({
        email: adminData.email,
        password: adminData.password,
        displayName: adminData.name,
      });
      console.log("✅ Admin user created in Auth.");
    }

    const { uid } = userRecord;

    // 2. Set Admin Custom Claims
    await admin.auth().setCustomUserClaims(uid, { role: "admin" });

    // 3. Save to the new 'admins' collection
    const adminRef = db.collection(COLLECTIONS.ADMIN).doc(uid);
    await adminRef.set(
      {
        email: adminData.email,
        name: adminData.name,
        role: "admin",
        status: "Active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    console.log(`✅ Admin account fully seeded at UID: ${uid}`);
    console.log(`👉 Collection: ${COLLECTIONS.ADMIN}`);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
  }

  process.exit(0);
}

seedAdmin();

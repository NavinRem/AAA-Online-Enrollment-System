const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Admin Bootstrapper CLI
 * Usage: node scripts/create-admin.js <email> <password> <name>
 */
async function createAdmin() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error("Usage: node scripts/create-admin.js <email> <password> <name>");
    process.exit(1);
  }

  const [email, password, name] = args;

  try {
    console.log(`🚀 Bootstrapping Admin Account for: ${email}...`);

    // 1. Create or Get Auth User
    let userRecord;
    try {
      userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: name,
        emailVerified: true
      });
      console.log(`✅ Auth user created: ${userRecord.uid}`);
    } catch (err) {
      if (err.code === "auth/email-already-exists") {
        userRecord = await admin.auth().getUserByEmail(email);
        console.log(`ℹ️ User already exists in Auth: ${userRecord.uid}`);
      } else throw err;
    }

    const uid = userRecord.uid;

    // 2. Set Admin Claim
    await admin.auth().setCustomUserClaims(uid, { role: "admin" });
    console.log(`🛡️  Admin custom claim set for ${uid}`);

    // 3. Create Firestore Profile
    const db = admin.firestore();
    const adminDoc = {
      email,
      name,
      role: "admin",
      status: "Active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection("admins").doc(uid).set(adminDoc, { merge: true });
    console.log(`📂 Firestore admin profile created/updated.`);

    console.log("\n✨ Admin bootstrapping successful! You can now log in to the dashboard.");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Bootstrapping failed:", error.message);
    process.exit(1);
  }
}

createAdmin();

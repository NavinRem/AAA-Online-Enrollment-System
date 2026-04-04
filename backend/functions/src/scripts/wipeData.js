const admin = require("firebase-admin");

/**
 * DANGER: This script wipes all data in the Firestore Emulator and Firebase Auth.
 * RUN WITH:
 * export FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"
 * export FIREBASE_AUTH_EMULATOR_HOST="127.0.0.1:9099"
 * node src/scripts/wipeData.js
 */
async function wipeData() {
  const projectId = process.env.FIREBASE_PROJECT_ID;

  // These are usually set via shell, but we can default them for safety
  process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST;
  process.env.FIREBASE_AUTH_EMULATOR_HOST =
    process.env.FIREBASE_AUTH_EMULATOR_HOST;

  console.log(
    `🔥 Starting Full System Wipe on Emulator [Project: ${projectId}]...`,
  );

  if (admin.apps.length === 0) {
    admin.initializeApp({ projectId });
  }

  const db = admin.firestore();

  // 1. Wipe Firestore
  try {
    const collections = await db.listCollections();
    if (collections.length === 0) {
      console.log("ℹ️ No collections found to delete.");
    }
    for (const collection of collections) {
      console.log(`🗑️ Deleting collection: ${collection.id}...`);
      const snapshot = await collection.get();
      const batch = db.batch();
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }
    console.log("✅ Firestore wiped.");
  } catch (err) {
    console.error("❌ Firestore wipe failed:", err.message);
  }

  // 2. Wipe Auth
  try {
    const listUsers = await admin.auth().listUsers();
    const uids = listUsers.users.map((user) => user.uid);
    if (uids.length > 0) {
      console.log(`👤 Deleting ${uids.length} users from Auth...`);
      await admin.auth().deleteUsers(uids);
      console.log("✅ Auth wiped.");
    } else {
      console.log("ℹ️ No users found in Auth.");
    }
  } catch (err) {
    console.error("❌ Auth wipe failed:", err.message);
  }

  console.log("✨ Wipe Complete. System is now empty.");
  process.exit(0);
}

wipeData();

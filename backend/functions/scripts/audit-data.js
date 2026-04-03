const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: "aaa-online-registration-e3833"
  });
}

const db = admin.firestore();

async function audit() {
  const collections = ["students", "parents", "guardians", "enrollments"];
  for (const col of collections) {
    const snap = await db.collection(col).limit(1).get();
    if (!snap.empty) {
      console.log(`\n--- ${col} ---`);
      console.log(JSON.stringify(snap.docs[0].data(), null, 2));
    }
  }
}

audit().catch(console.error);

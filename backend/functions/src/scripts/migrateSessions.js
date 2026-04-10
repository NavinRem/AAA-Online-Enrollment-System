// Map INTERNAL_ vars to the SDK-expected emulator host vars
process.env.FIRESTORE_EMULATOR_HOST = process.env.INTERNAL_FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";

const { db, COLLECTIONS } = require("../config/database");

async function migrateSessions() {
  console.log("🚀 Starting Session Branch Migration...");

  try {
    const defaultBranch = {
      id: "FM",
      name: "Funmall",
      abbr: "FM"
    };

    console.log("📍 Default branch set to:", defaultBranch.name);

    const snapshot = await db.collection(COLLECTIONS.SESSION).get();
    console.log(`📊 Found ${snapshot.size} sessions.`);

    let updatedCount = 0;
    let skippedCount = 0;

    const batch = db.batch();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (!data.branch) {
        batch.update(doc.ref, {
          branch: defaultBranch,
          updatedAt: new Date().toISOString()
        });
        updatedCount++;
      } else {
        skippedCount++;
      }
    }

    if (updatedCount > 0) {
      await batch.commit();
    }

    console.log("\n✅ MIGRATION SUCCESSFUL");
    console.log("-----------------------------------------");
    console.log(`Sessions Updated: ${updatedCount}`);
    console.log(`Sessions Skipped: ${skippedCount}`);
    console.log("-----------------------------------------");

  } catch (error) {
    console.error("\n❌ MIGRATION FAILED:", error.message);
  }

  process.exit(0);
}

migrateSessions();

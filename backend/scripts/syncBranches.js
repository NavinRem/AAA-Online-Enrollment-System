/**
 * syncBranches.js
 * ---------------
 * One-time script to seed branch data and calculate all stats from existing records.
 * Run with: node backend/scripts/syncBranches.js
 */

const path = require("path");
const FUNCTIONS_DIR = path.resolve(__dirname, "../functions");

// Load dotenv from functions folder
require(path.join(FUNCTIONS_DIR, "node_modules/dotenv")).config({
  path: path.join(FUNCTIONS_DIR, ".env"),
});

// Point at the emulator
process.env.FIRESTORE_EMULATOR_HOST =
  process.env.INTERNAL_FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";

const admin = require(path.join(FUNCTIONS_DIR, "node_modules/firebase-admin"));

if (admin.apps.length === 0) {
  admin.initializeApp({ projectId: process.env.INTERNAL_PROJECT_ID });
}

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

// ─── Branch Seed Data ────────────────────────────────────────────────────────

const BRANCH_SEED = [
  {
    id: "FM",
    name: "Funmall",
    abbr: "FM",
    location: "FUN MALL, 3rd Floor, Street 315, Khan Toul Kork, Phnom Penh",
  },
  {
    id: "OCIC",
    name: "OCIC",
    abbr: "OCIC",
    location: "OCIC City, Sakura Avenue, Khan Chroy Changvar, Phnom Penh",
  },
  {
    id: "AEON",
    name: "AEON",
    abbr: "AEON",
    location: "AEON Mall Phnom Penh, 132 Samdach Sothearos Blvd, Phnom Penh",
  },
  {
    id: "PH",
    name: "Peng Hout",
    abbr: "PH",
    location:
      "Grand Star Platinum, National Road 1, Khan Chbar Ampov, Phnom Penh",
  },
  {
    id: "CM",
    name: "Chip Mong",
    abbr: "CM",
    location: "Chip Mong 271 Mega Mall, 2nd Floor, Phnom Penh",
  },
  {
    id: "SKY",
    name: "Sky City",
    abbr: "SKY",
    location: "Sky City Tower, Phnom Penh",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBranchId(doc) {
  const data = doc.data();
  // Try flat field first, then nested object field
  return data.branchId || data.branch?.id || null;
}

// ─── Core Sync Logic ─────────────────────────────────────────────────────────

async function calculateStats(branchId) {
  const today = new Date().toISOString().split("T")[0];

  // Fetch all students, enrollments, and sessions in parallel
  const [allStudentsSnap, allEnrollmentsSnap, allSessionsSnap] =
    await Promise.all([
      db.collection("students").get(),
      db.collection("enrollments").get(),
      db.collection("sessions").get(),
    ]);

  // Filter in JS to handle both 'branchId' and 'branch.id' fields
  const students = allStudentsSnap.docs.filter((d) => {
    const data = d.data();
    return data.branchId === branchId || data.branch?.id === branchId;
  });

  const enrollments = allEnrollmentsSnap.docs.filter((d) => {
    const data = d.data();
    return data.branchId === branchId || data.branch?.id === branchId;
  });

  const sessions = allSessionsSnap.docs.filter((d) => {
    const data = d.data();
    return data.branchId === branchId || data.branch?.id === branchId;
  });

  // Unique programs from sessions
  const programIds = new Set(
    sessions.map((d) => d.data().programId).filter(Boolean)
  );

  let totalRevenue = 0;
  let pendingRevenue = 0;
  let newTodayCount = 0;

  enrollments.forEach((doc) => {
    const data = doc.data();
    const status = (data.paymentStatus || "").toLowerCase();
    const amount = data.amount || 0;

    if (["paid", "confirmed", "active", "success"].includes(status)) {
      totalRevenue += amount;
    } else {
      pendingRevenue += amount;
    }

    const createdAt = data.createdAt?.toDate
      ? data.createdAt.toDate().toISOString().split("T")[0]
      : (data.createdAt || "").split("T")[0];

    if (createdAt === today) newTodayCount++;
  });

  return {
    studentCount: students.length,
    programCount: programIds.size,
    sessionCount: sessions.length,
    newTodayCount,
    totalRevenue,
    pendingRevenue,
    lastUpdate: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log("🚀 Starting Branch Seed + Sync...\n");

  for (const branch of BRANCH_SEED) {
    const { id, ...data } = branch;
    const ref = db.collection("branches").doc(id);

    // Upsert: keep existing fields but overwrite identity + location
    await ref.set(
      {
        ...data,
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log(`📍 Seeded branch: ${id} (${data.name})`);
  }

  console.log("\n📊 Calculating stats...\n");

  for (const branch of BRANCH_SEED) {
    const stats = await calculateStats(branch.id);
    await db.collection("branches").doc(branch.id).update(stats);

    console.log(
      `✅ ${branch.name.padEnd(12)} | Students: ${stats.studentCount} | Sessions: ${stats.sessionCount} | Programs: ${stats.programCount} | Revenue: $${stats.totalRevenue.toFixed(2)} | Pending: $${stats.pendingRevenue.toFixed(2)}`
    );
  }

  console.log("\n🎉 Done! All branch data is now saved to Firestore.\n");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Script failed:", err);
  process.exit(1);
});

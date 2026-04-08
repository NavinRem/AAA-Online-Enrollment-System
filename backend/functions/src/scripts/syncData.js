// 1. Environment Configuration
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const profileHelper = require("../utils/profileHelper");

process.env.GCLOUD_PROJECT = process.env.INTERNAL_PROJECT_ID;
process.env.FIRESTORE_EMULATOR_HOST = process.env.INTERNAL_FIRESTORE_EMULATOR_HOST;
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.INTERNAL_AUTH_EMULATOR_HOST;

const admin = require("firebase-admin");
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: process.env.GCLOUD_PROJECT,
    storageBucket: process.env.INTERNAL_STORAGE_BUCKET,
  });
}

const db = admin.firestore();
const { COLLECTIONS } = require("../config/database");
const branchService = require("../services/branchService");

const BRANCH_SEED = [
  { id: "FM", name: "Funmall", abbr: "FM", location: "FUN MALL, Phnom Penh" },
  { id: "OCIC", name: "OCIC", abbr: "OCIC", location: "OCIC City, Phnom Penh" },
  { id: "AEON", name: "AEON", abbr: "AEON", location: "AEON Mall, Phnom Penh" },
  { id: "PH", name: "Peng Hout", abbr: "PH", location: "National Road 1, Phnom Penh" },
  { id: "CM", name: "Chip Mong", abbr: "CM", location: "271 Mega Mall, Phnom Penh" },
  { id: "SKY", name: "Sky City", abbr: "SKY", location: "Sky City Tower, Phnom Penh" },
];

const TERM_SEED = [
  { id: "T1-2026", name: "Term 1 - 2026", startDate: "2026-01-05", endDate: "2026-03-27" },
  { id: "T2-2026", name: "Term 2 - 2026", startDate: "2026-04-06", endDate: "2026-06-26" },
];

const CATEGORY_SEED = [
  { id: "music", name: "Music", levels: [{ id: "gr1", name: "Grade 1" }, { id: "gr2", name: "Grade 2" }] },
  { id: "dance", name: "Dance", levels: [{ id: "lvl1", name: "Level 1" }, { id: "lvl2", name: "Level 2" }] },
  { id: "art", name: "Art", levels: [{ id: "jr", name: "Junior" }, { id: "sr", name: "Senior" }] },
];

const PROGRAM_SEED = [
  {
    id: "piano-gr1",
    name: "Piano - Grade 1",
    categoryId: "music",
    category: "Music",
    levelId: "gr1",
    level: "Grade 1",
    basePrice: 240,
    sessionNumber: 12,
    weeksNumber: 12,
    maxCapacity: 1,
    type: "private",
    schedules: [
      { day: "Monday", timeslot: "16:00 - 17:00" },
      { day: "Wednesday", timeslot: "17:00 - 18:00" }
    ]
  },
  {
    id: "ballet-lvl1",
    name: "Ballet - Level 1",
    categoryId: "dance",
    category: "Dance",
    levelId: "lvl1",
    level: "Level 1",
    basePrice: 180,
    sessionNumber: 11,
    weeksNumber: 11,
    maxCapacity: 15,
    type: "group",
    schedules: [
      { day: "Tuesday", timeslot: "16:00 - 17:00" },
      { day: "Thursday", timeslot: "16:00 - 17:00" }
    ]
  }
];

async function syncAllData() {
  console.log("🚀 Starting Hierarchical Data Redesign Sync...");

  try {
    // 1. Wipe Old Data
    console.log("--- 1/6 Wiping existing program/class data ---");
    const collectionsToWipe = [COLLECTIONS.PROGRAM, COLLECTIONS.CLASS, COLLECTIONS.TERM, COLLECTIONS.SESSION, COLLECTIONS.CATEGORY];
    for (const coll of collectionsToWipe) {
      const snap = await db.collection(coll).get();
      const batch = db.batch();
      snap.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`🗑️ Wiped ${coll}`);
    }

    // 2. Seed Branches
    console.log("--- 2/6 Seeding Branches ---");
    const branchMap = {};
    for (const b of BRANCH_SEED) {
      const ref = db.collection(COLLECTIONS.BRANCH).doc(b.id);
      await ref.set({ ...b, updatedAt: new Date().toISOString() });
      branchMap[b.id] = await ref.get();
      console.log(`📍 Seeded Branch: ${b.id}`);
    }

    // 3. Seed Terms
    console.log("--- 3/6 Seeding Terms ---");
    const termMap = {};
    for (const t of TERM_SEED) {
      const ref = db.collection(COLLECTIONS.TERM).doc(t.id);
      await ref.set({ ...t, createdAt: new Date().toISOString() });
      termMap[t.id] = await ref.get();
      console.log(`📅 Seeded Term: ${t.id}`);
    }

    // 4. Seed Categories & Levels
    console.log("--- 4/6 Seeding Categories & Levels ---");
    for (const cat of CATEGORY_SEED) {
      const catRef = db.collection(COLLECTIONS.CATEGORY).doc(cat.id);
      await catRef.set({ name: cat.name });
      for (const lvl of cat.levels) {
        await catRef.collection(COLLECTIONS.LEVEL).doc(lvl.id).set({ name: lvl.name });
      }
      console.log(`🎨 Seeded Category: ${cat.name}`);
    }

    // 5. Seed Program Models & Schedules
    console.log("--- 5/6 Seeding Program Catalog & Bone Structure ---");
    const programMap = {};
    for (const p of PROGRAM_SEED) {
      const { schedules, ...pData } = p;
      const ref = db.collection(COLLECTIONS.PROGRAM).doc(p.id);
      await ref.set({ ...pData, createdAt: new Date().toISOString() });
      
      for (const sch of schedules) {
        await ref.collection(COLLECTIONS.SCHEDULE).add({ ...sch, createdAt: new Date().toISOString() });
      }
      programMap[p.id] = await ref.get();
      console.log(`📘 Seeded Program Model: ${p.name}`);
    }

    // 6. Seed Initial Class Instances
    console.log("--- 6/6 Seeding Initial Class Instances (Operational) ---");
    let classCount = 0;
    const teachersSnap = await db.collection(COLLECTIONS.ADMIN).where("role", "==", "teacher").limit(1).get();
    const teacher = !teachersSnap.empty ? teachersSnap.docs[0] : null;

    for (const tId of [TERM_SEED[0].id]) {
      for (const bId of [BRANCH_SEED[0].id, BRANCH_SEED[1].id]) {
        for (const p of PROGRAM_SEED) {
          const classData = {
            programId: p.id,
            termId: tId,
            branchId: bId,
            teacherId: teacher ? teacher.id : null,
            
            program: profileHelper.getProgramSnapshot(p.id, p),
            term: profileHelper.getTermSnapshot(tId, termMap[tId].data()),
            branch: profileHelper.getBranchSnapshot(bId, branchMap[bId].data()),
            teacher: teacher ? profileHelper.getUserSnapshot(teacher.id, teacher.data()) : null,

            day: p.schedules[0].day,
            timeslot: p.schedules[0].timeslot,
            scheduleType: "fix",
            status: "open",
            price: p.basePrice,
            capacity: p.maxCapacity,
            numStudent: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await db.collection(COLLECTIONS.CLASS).add(classData);
          classCount++;
        }
      }
    }
    console.log(`🏫 Created ${classCount} initial class instances.`);

    // 7. Finalize Branch Stats
    console.log("--- 7/7 Finalizing Branch Stats ---");
    for (const b of BRANCH_SEED) {
      await branchService.calculateAndSyncStats(b.id);
    }

    console.log("✅ HIERARCHICAL DATA SYNC COMPLETED SUCCESSFULLY!");
  } catch (err) {
    console.error("❌ Sync failed:", err);
  }
}

if (require.main === module) {
  syncAllData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = syncAllData;

const admin = require("firebase-admin");

// Initialize Admin SDK - use environment variables for emulator support
admin.initializeApp();

const db = admin.firestore();

const COLLECTIONS = {
  PARENT: "parents",
  GUARDIAN: "guardians",
  STUDENT: "students",
  ADMIN: "admins",
  TEACHER: "teachers",
};

async function syncAllData() {
  console.log("Starting deep data synchronization and mirroring...");
  const userRoleCollections = [COLLECTIONS.PARENT, COLLECTIONS.GUARDIAN, COLLECTIONS.ADMIN, COLLECTIONS.TEACHER];
  const parentMap = {}; // uid -> ParentSnapshot
  const studentMap = {}; // studentId -> StudentSnapshot
  let processedCount = 0;

  try {
    // 1. Map all Users (Parents/Guardians/Staff)
    for (const col of userRoleCollections) {
      console.log(`Processing collection: ${col}...`);
      const snap = await db.collection(col).get();
      for (const doc of snap.docs) {
        const data = doc.data();
        const uid = doc.id;
        
        const name = data.name || data.fullName || data.username || "User";
        const email = data.email || "N/A";
        const phone = data.phone || "N/A";
        const role = data.role || (col === COLLECTIONS.GUARDIAN ? "guardian" : "parent");
        const profile = data.profile || data.profileURL || null;
        const profileURL = data.profileURL || data.profile || null;

        parentMap[uid] = {
          id: uid,
          name,
          email,
          phone,
          role,
          roleDisplay: role === "parent" ? "Parent" : role.charAt(0).toUpperCase() + role.slice(1),
          profile,
          profileURL
        };

        await doc.ref.update({ name, profile, profileURL, role });
        processedCount++;
      }
    }

    // 2. Map all Students
    console.log("Processing students...");
    const studentsSnap = await db.collection(COLLECTIONS.STUDENT).get();
    for (const doc of studentsSnap.docs) {
      const data = doc.data();
      const sid = doc.id;
      
      const name = data.name || data.fullName || "Student";
      const dob = data.dob || data.DoB || null;
      const medicalNote = data.medicalNote || "None";
      const profile = data.profile || data.profileURL || data.childProfileURL || null;
      const profileURL = data.profileURL || data.profile || data.childProfileURL || null;
      const parentId = data.parentId;

      studentMap[sid] = {
        id: sid,
        name,
        dob,
        medicalNote,
        profile,
        profileURL,
        parentId
      };

      await doc.ref.update({ name, dob, medicalNote, profile, profileURL });
      processedCount++;
    }

    // 3. Mirror Parent Info INTO Students
    console.log("Mirroring parent info into students...");
    const studentIds = Object.keys(studentMap);
    for (const sid of studentIds) {
      const sData = studentMap[sid];
      if (sData.parentId && parentMap[sData.parentId]) {
        const parentInfo = parentMap[sData.parentId];
        await db.collection(COLLECTIONS.STUDENT).doc(sid).set({ parentInfo }, { merge: true });
        
        // Also update sub-collection
        for (const col of [COLLECTIONS.PARENT, COLLECTIONS.GUARDIAN]) {
          const subRef = db.collection(col).doc(sData.parentId).collection("students").doc(sid);
          const subDoc = await subRef.get();
          if (subDoc.exists) {
            await subRef.set({ parentInfo }, { merge: true });
          }
        }
      }
    }

    // 4. Mirror Student List INTO Parents/Guardians
    console.log("Mirroring student lists into parents...");
    const parentIds = Object.keys(parentMap);
    for (const uid of parentIds) {
      const studentsForParent = Object.values(studentMap)
        .filter(s => s.parentId === uid)
        .map(s => ({
          id: s.id,
          name: s.name,
          dob: s.dob,
          medicalNote: s.medicalNote,
          profile: s.profile,
          profileURL: s.profileURL
        }));
      
      if (studentsForParent.length > 0) {
        const parentCol = parentMap[uid].role === "guardian" ? COLLECTIONS.GUARDIAN : COLLECTIONS.PARENT;
        await db.collection(parentCol).doc(uid).update({
          studentInfo: studentsForParent
        });
      }
    }

    console.log("✅ Sync completed successfully!");
    console.log(`Summary: Processed ${processedCount} entities. Mapped ${Object.keys(parentMap).length} parents and ${Object.keys(studentMap).length} students.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Sync failed:", err);
    process.exit(1);
  }
}

syncAllData();

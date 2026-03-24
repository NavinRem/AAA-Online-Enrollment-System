const admin = require("firebase-admin");
const serviceAccount = require("../configs/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrate() {
  console.log("Starting migration: courses -> programs");
  
  const coursesSnap = await db.collection("courses").get();
  console.log(`Found ${coursesSnap.size} courses to migrate.`);

  const batch = db.batch();
  
  for (const doc of coursesSnap.docs) {
    const data = doc.data();
    const newRef = db.collection("programs").doc(doc.id);
    batch.set(newRef, data);
  }

  await batch.commit();
  console.log("Successfully copied courses to programs collection.");

  console.log("Updating enrollments to use program terminology...");
  const enrollmentsSnap = await db.collection("enrollment").get();
  console.log(`Found ${enrollmentsSnap.size} enrollments to update.`);

  let updateCount = 0;
  for (const doc of enrollmentsSnap.docs) {
    const data = doc.data();
    const updates = {};
    
    if (data.courseId && !data.programId) updates.programId = data.courseId;
    if (data.courseTitle && !data.programTitle) updates.programTitle = data.courseTitle;
    if (data.courseCategory && !data.programCategory) updates.programCategory = data.courseCategory;
    
    if (Object.keys(updates).length > 0) {
      await doc.ref.update(updates);
      updateCount++;
    }
  }

  console.log(`Successfully updated ${updateCount} enrollment records.`);
  console.log("Migration complete!");
}

migrate().catch(console.error);

const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "aaa-online-registration-e3833",
  });
}

const db = getFirestore("registration");

async function checkData() {
  try {
    const usersSnapshot = await db.collection("user").get();
    let testerUid = null;
    let actualTesterUid = null;

    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email === "tester@aaa.com") testerUid = doc.id;
      if (data.name === "Actual Tester") actualTesterUid = doc.id;
    });

    console.log("tester@aaa.com UID:", testerUid);
    console.log("Actual Tester UID:", actualTesterUid);

    if (testerUid || actualTesterUid) {
      const idToUpdate = testerUid || actualTesterUid;
      await db.collection("user").doc(idToUpdate).update({ role: "admin" });
      console.log("Updated to admin!");
    } else {
      console.log("Tester users not found.");
    }

    // Check enrollments counts
    const enrollSnapshot = await db.collection("enrollment").get();
    console.log("Enrollments found:", enrollSnapshot.size);
  } catch (e) {
    console.error("Error:", e);
  }
}

checkData();

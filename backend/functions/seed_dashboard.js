const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "aaa-online-registration-e3833",
  });
}

const db = getFirestore("registration");

async function seedData() {
  console.log("Seeding data to match specific mockup...");
  try {
    // 1. Delete all existing enrollments / user / student / course exactly as shown?
    // Let's just create exactly what we need for Recent Enrollments.

    // Create Users (Parents)
    const p1_id = "parent_diana";
    const p2_id = "parent_johnny";
    const p3_id = "parent_karina";

    await db
      .collection("user")
      .doc(p1_id)
      .set({
        email: "diana@example.com",
        name: "Diana Holmes",
        role: "parent",
        createdAt: "2026-02-15T08:45:31Z",
      });
    await db
      .collection("user")
      .doc(p2_id)
      .set({
        email: "johnny@example.com",
        name: "Johnny Depp",
        role: "parent",
        createdAt: "2026-02-15T08:45:31Z",
      });
    await db
      .collection("user")
      .doc(p3_id)
      .set({
        email: "karina@example.com",
        name: "Karina Tame",
        role: "parent",
        createdAt: "2026-02-15T08:45:31Z",
      });

    // Create Students
    const s1_id = "student_christopher";
    const s2_id = "student_rose";
    const s3_id = "student_paul";
    await db
      .collection("student")
      .doc(s1_id)
      .set({
        parent_id: p1_id,
        fullname: "Christopher Holmes",
        createdAt: "2026-02-15T08:45:31Z",
      });
    await db
      .collection("student")
      .doc(s2_id)
      .set({
        parent_id: p2_id,
        fullname: "Rose Depp",
        createdAt: "2026-02-15T08:45:31Z",
      });
    await db
      .collection("student")
      .doc(s3_id)
      .set({
        parent_id: p3_id,
        fullname: "Paul Tame",
        createdAt: "2026-02-15T08:45:31Z",
      });

    // Create Courses
    const c1_id = "course_piano";
    const c2_id = "course_taekwondo";
    const c3_id = "course_robotic";
    await db
      .collection("course")
      .doc(c1_id)
      .set({ title: "Piano", price: 180, createdAt: "2026-02-15T08:45:31Z" });
    await db
      .collection("course")
      .doc(c2_id)
      .set({
        title: "Taekwondo",
        price: 180,
        createdAt: "2026-02-15T08:45:31Z",
      });
    await db
      .collection("course")
      .doc(c3_id)
      .set({ title: "Robotic", price: 180, createdAt: "2026-02-15T08:45:31Z" });

    // Enrollments
    const regParams = [
      {
        student_id: s1_id,
        parent_id: p1_id,
        course_id: c1_id,
        status: "confirmed", // displays as Paid
        amount: 180,
        createdAt: "2026-02-15T08:45:31Z", // ISO parses directly via our component
      },
      {
        student_id: s2_id,
        parent_id: p2_id,
        course_id: c2_id,
        status: "pending", // displays as Unpaid
        amount: 180,
        createdAt: "2026-02-15T08:45:31Z",
      },
      {
        student_id: s3_id,
        parent_id: p3_id,
        course_id: c3_id,
        status: "canceled", // displays as Canceled
        amount: 180,
        createdAt: "2026-02-15T08:45:31Z",
      },
    ];

    // Wipe old enrollments so our table is perfectly matching the mockup for the top 3
    const oldEnrollments = await db.collection("enrollment").get();
    for (const doc of oldEnrollments.docs) {
      await doc.ref.delete();
    }

    for (const r of regParams) {
      await db.collection("enrollment").add(r);
    }

    console.log("Seeding successful!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

seedData();

const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "aaa-online-registration-e3833",
  });
}

const db = getFirestore("registration");

async function seed() {
  console.log("Starting seed process...");

  try {
    // Clear old enrollments to prevent clutter
    const oldEnrollments = await db.collection("enrollment").get();
    let count = 0;
    for (const doc of oldEnrollments.docs) {
      await doc.ref.delete();
      count++;
    }
    console.log(`Deleted ${count} old enrollments.`);

    // 1. Create realistic Parents
    const p1_id = "parent_new_001";
    const p2_id = "parent_new_002";
    const p3_id = "parent_new_003";

    await db.collection("user").doc(p1_id).set({
      email: "sarah.smith@example.com",
      name: "Sarah Smith",
      phone: "123-456-7890",
      role: "parent",
      createdAt: new Date().toISOString(),
    });

    await db.collection("user").doc(p2_id).set({
      email: "james.bond@example.com",
      name: "James Bond",
      phone: "007-007-0070",
      role: "parent",
      createdAt: new Date().toISOString(),
    });

    await db.collection("user").doc(p3_id).set({
      email: "tony.stark@example.com",
      name: "Tony Stark",
      phone: "999-999-9999",
      role: "parent",
      createdAt: new Date().toISOString(),
    });

    // 2. Create realistic Students
    const s1_ref = db.collection("student").doc();
    const s2_ref = db.collection("student").doc();
    const s3_ref = db.collection("student").doc();
    const s4_ref = db.collection("student").doc();

    await s1_ref.set({
      parent_id: p1_id,
      fullname: "Tommy Smith",
      DoB: "2015-05-10",
      createdAt: new Date().toISOString(),
    });

    await s2_ref.set({
      parent_id: p1_id,
      fullname: "Emily Smith",
      DoB: "2017-08-22",
      createdAt: new Date().toISOString(),
    });

    await s3_ref.set({
      parent_id: p2_id,
      fullname: "Mary Bond",
      DoB: "2012-11-05",
      createdAt: new Date().toISOString(),
    });

    await s4_ref.set({
      parent_id: p3_id,
      fullname: "Peter Stark",
      DoB: "2016-01-14",
      createdAt: new Date().toISOString(),
    });

    // 3. Create realistic Courses
    const c1_id = "course_math_sim_1";
    const c2_id = "course_science_sim_1";
    const c3_id = "course_art_sim_1";

    await db.collection("course").doc(c1_id).set({
      title: "Advanced Math Simulator",
      description: "Intro to Advanced Math",
      price: 250,
      category: "Math",
      createdAt: new Date().toISOString(),
    });

    await db.collection("course").doc(c2_id).set({
      title: "Physics Discoveries",
      description: "Intro to Physics",
      price: 300,
      category: "Science",
      createdAt: new Date().toISOString(),
    });

    await db.collection("course").doc(c3_id).set({
      title: "Creative Painting",
      description: "Art for kids",
      price: 150,
      category: "Art",
      createdAt: new Date().toISOString(),
    });

    // 4. Create Sessions
    const sess1_id = "sess_math_1_spring";
    const sess2_id = "sess_physics_1_spring";

    await db.collection("session").doc(sess1_id).set({
      course_id: c1_id,
      capacity: 20,
      num_student: 2,
      start_date: "2026-03-01",
      end_date: "2026-06-01",
    });

    await db.collection("session").doc(sess2_id).set({
      course_id: c2_id,
      capacity: 15,
      num_student: 2,
      start_date: "2026-03-15",
      end_date: "2026-06-15",
    });

    // 5. Create Enrollments with varying dates
    const d1 = new Date();
    d1.setDate(d1.getDate() - 1); // yesterday
    const d2 = new Date();
    d2.setDate(d2.getDate() - 2); // 2 days ago
    const d3 = new Date();
    d3.setDate(d3.getDate() - 5); // 5 days ago
    const d_today = new Date(); // today

    const enrollments = [
      {
        student_id: s1_ref.id,
        parent_id: p1_id,
        course_id: c1_id,
        session_id: sess1_id,
        status: "confirmed",
        paymentStatus: "paid",
        amount: 250,
        totalAmount: 250,
        createdAt: d1.toISOString(),
      },
      {
        student_id: s2_ref.id,
        parent_id: p1_id,
        course_id: c2_id,
        session_id: sess2_id,
        status: "pending",
        paymentStatus: "unpaid",
        amount: 300,
        totalAmount: 300,
        createdAt: d2.toISOString(),
      },
      {
        student_id: s3_ref.id,
        parent_id: p2_id,
        course_id: c1_id,
        session_id: sess1_id,
        status: "confirmed",
        paymentStatus: "paid",
        amount: 250,
        totalAmount: 250,
        createdAt: d_today.toISOString(),
      },
      {
        student_id: s4_ref.id,
        parent_id: p3_id,
        course_id: c2_id,
        session_id: sess2_id,
        status: "canceled",
        paymentStatus: "refunded",
        amount: 300,
        totalAmount: 300,
        createdAt: d3.toISOString(),
      },
      {
        student_id: s1_ref.id,
        parent_id: p1_id,
        course_id: c3_id,
        session_id: sess1_id,
        status: "confirmed",
        paymentStatus: "paid",
        amount: 150,
        totalAmount: 150,
        createdAt: d_today.toISOString(),
      },
    ];

    for (const e of enrollments) {
      await db.collection("enrollment").add(e);
    }

    console.log(
      "Mock data successfully seeded. Dashboard will now look realistic.",
    );
  } catch (error) {
    console.error("Error during seeding:", error);
  }
}

seed();

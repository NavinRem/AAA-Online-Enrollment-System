const userService = require("../services/userService");

/**
 * @route POST /users
 * @description Create or update a user profile
 */
/**
 * @route POST /users/registerParentAccount
 * @description Create or update a parent account
 */
exports.registerParentAccount = async (req, res) => {
  try {
    const result = await userService.registerParentAccount(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /users
 * @description Get all users
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /users/:uid
 * @description Get a single user by ID
 */
exports.getUser = async (req, res) => {
  try {
    const user = await userService.getUser(req.params.uid);
    res.status(200).json(user);
  } catch (error) {
    if (error.message === "User not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /users/:uid/role
 * @description Get user role
 */
exports.getUserRole = async (req, res) => {
  try {
    const roleData = await userService.getUserRole(req.params.uid);
    res.status(200).json(roleData);
  } catch (error) {
    if (error.message === "User not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route POST /users/:uid/registerStudentProfile
 * @description Add a student/child to a parent's account (Root 'student' collection)
 */
exports.registerStudentProfile = async (req, res) => {
  try {
    const result = await userService.registerStudentProfile(
      req.params.uid,
      req.body,
    );
    res.status(201).json(result);
  } catch (error) {
    if (error.message === "Full Name and Date of Birth are required") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route PUT /students/:id/medical
 * @description Update medical info for a student
 */
exports.updateMedicalInfo = async (req, res) => {
  try {
    const result = await userService.updateMedicalInfo(
      req.params.id,
      req.body.medical_note,
    );
    res.status(200).json(result);
  } catch (error) {
    if (error.message === "Medical note is required") {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === "Student not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /users/:uid/students
 * @description Get all students/children for a parent
 */
exports.getStudentsByParentID = async (req, res) => {
  try {
    const students = await userService.getStudentsByParentID(req.params.uid);
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /users/allStudents
 * @description Get all students (admin only in UI logic usually)
 */
exports.getAllStudents = async (req, res) => {
  try {
    const students = await userService.getAllStudents();
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /users/seed
 * @description Temporary seed script for the dashboard.
 */
exports.seedData = async (req, res) => {
  try {
    const { getFirestore } = require("firebase-admin/firestore");
    const db = getFirestore("registration");
    console.log("Seeding triggered...");

    // 1. Delete all non-admin users, all students, courses, sessions, enrollments
    const usersSnapshot = await db.collection("user").get();
    for (const doc of usersSnapshot.docs) {
      if (doc.data().role !== "admin") {
        await doc.ref.delete();
      }
    }

    const collectionsToDelete = ["enrollment", "student", "course", "session"];
    for (const coll of collectionsToDelete) {
      const snapshot = await db.collection(coll).get();
      for (const doc of snapshot.docs) {
        await doc.ref.delete();
      }
    }

    // 2. Create realistic Parents
    const p1_id = "parent_mock_001";
    const p2_id = "parent_mock_002";
    await db.collection("user").doc(p1_id).set({
      email: "jane.doe@example.com",
      name: "Jane Doe",
      phone: "111-222-3333",
      role: "parent",
      createdAt: new Date().toISOString(),
    });
    await db.collection("user").doc(p2_id).set({
      email: "bob.smith@example.com",
      name: "Bob Smith",
      phone: "444-555-6666",
      role: "parent",
      createdAt: new Date().toISOString(),
    });

    // 3. Create realistic Students
    const s1_ref = db.collection("student").doc();
    const s2_ref = db.collection("student").doc();
    const s3_ref = db.collection("student").doc();
    await s1_ref.set({
      parent_id: p1_id,
      fullname: "Alice Doe",
      DoB: "2014-04-10",
      createdAt: new Date().toISOString(),
    });
    await s2_ref.set({
      parent_id: p1_id,
      fullname: "Charlie Doe",
      DoB: "2016-08-22",
      createdAt: new Date().toISOString(),
    });
    await s3_ref.set({
      parent_id: p2_id,
      fullname: "David Smith",
      DoB: "2013-11-05",
      createdAt: new Date().toISOString(),
    });

    // 4. Create Courses & Sessions
    const c1_id = "course_biology_101";
    await db
      .collection("course")
      .doc(c1_id)
      .set({
        title: "Biology 101",
        description: "Intro to Biology",
        price: 200,
        category: "Science",
        createdAt: new Date().toISOString(),
      });
    const sess1_id = "sess_biology_1_spring";
    await db
      .collection("session")
      .doc(sess1_id)
      .set({
        course_id: c1_id,
        capacity: 20,
        num_student: 0,
        start_date: "2026-03-01",
        end_date: "2026-06-01",
      });

    // 5. Enrollments - One today, one earlier this week, one last week
    const now = new Date();
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      12,
      0,
      0,
    ); // Noon today

    const dayOfWeek = now.getDay();
    const daysSinceMonday = (dayOfWeek + 6) % 7;
    let earlyThisWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - Math.max(0, daysSinceMonday - 1),
      10,
      0,
      0,
    );
    if (earlyThisWeek.getTime() >= today.getTime()) {
      earlyThisWeek = new Date(today.getTime() - 2 * 60 * 60 * 1000);
    }

    // Calculate a date that is definitely "last week"
    const lastWeek = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000);

    const enrollments = [
      {
        student_id: s1_ref.id,
        parent_id: p1_id,
        course_id: c1_id,
        session_id: sess1_id,
        status: "confirmed",
        paymentStatus: "paid",
        amount: 200,
        totalAmount: 200,
        createdAt: today.toISOString(),
      },
      {
        student_id: s2_ref.id,
        parent_id: p1_id,
        course_id: c1_id,
        session_id: sess1_id,
        status: "pending",
        paymentStatus: "unpaid",
        amount: 200,
        totalAmount: 200,
        createdAt: earlyThisWeek.toISOString(),
      },
      {
        student_id: s3_ref.id,
        parent_id: p2_id,
        course_id: c1_id,
        session_id: sess1_id,
        status: "confirmed",
        paymentStatus: "paid",
        amount: 150,
        totalAmount: 150,
        createdAt: lastWeek.toISOString(),
      }, // Should NOT appear in 'This Week'
    ];
    for (const e of enrollments) await db.collection("enrollment").add(e);

    res.status(200).json({ status: "Seeded clean mock data successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

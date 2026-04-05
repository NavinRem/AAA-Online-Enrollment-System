const admin = require("firebase-admin");
const { db, COLLECTIONS } = require("../config/database");

// Import Services to ensure we test the ACTUAL logic
const termService = require("../services/termService");
const categoryService = require("../services/categoryService");
const levelService = require("../services/levelService");
const programService = require("../services/programService");
const sessionService = require("../services/sessionService");
const userService = require("../services/userService");
const studentService = require("../services/studentService");
const enrollmentService = require("../services/enrollmentService");
const paymentService = require("../services/paymentService");

/**
 * Full System Integration Test Seed
 * Creates 1 record in every collection using the Service layer.
 */
async function seedFullSystem() {
  // Ensure we are targeting the emulator
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";

  console.log("🧪 Starting Full System Integration Seed...");

  try {
    // 1. Seed Term
    console.log("📅 Seeding Term...");
    const term = await termService.createTerm({
      name: "Spring 2026",
      startDate: "2026-01-01",
      endDate: "2026-03-31",
      status: "Active",
    });
    const termId = term.id;

    // 2. Seed Category
    console.log("📁 Seeding Category...");
    const category = await categoryService.createCategory({
      name: "Robotics",
      description: "STEM and Robotics",
    });
    const categoryId = category.id;

    // 3. Seed Level
    console.log("📊 Seeding Level...");
    const level = await levelService.createLevel(categoryId, {
      name: "Beginner",
      description: "Introductory level",
    });
    const levelId = level.id;

    // 4. Seed Admin (Teacher)
    console.log("🛡️ Seeding Admin/Teacher...");
    const adminUser = await userService.registerAdminAccount({
      email: "staff@aaa.com",
      password: "Admin123!",
      name: "Master Teacher",
      role: "admin",
    });
    const adminUid = adminUser.uid;

    // 5. Seed Program
    console.log("🎓 Seeding Program...");
    const program = await programService.createProgram({
      title: "Intro to LEGO Robotics",
      categoryId,
      category: "Robotics",
      description: "Build and code your first robot.",
      price: 250,
      numberSessions: 10,
      level: "Beginner",
      levelId,
      termId,
      teachers: [{ id: adminUid, name: "Master Teacher" }],
    });
    const programId = program.id;

    // 6. Seed Session
    console.log("🕒 Seeding Session...");
    const session = await sessionService.createSession({
      programId,
      capacity: 15,
      schedule: { Monday: "16:00 - 17:30" },
      teachers: [{ id: adminUid, role: "Lead" }],
    });
    const sessionId = session.id;

    // 7. Seed Parent
    console.log("👨‍👩‍👧 Seeding Parent...");
    const parent = await userService.registerParentAccount({
      email: "parent@test.com",
      password: "Parent123!",
      name: "John Parent",
      phone: "555-0199",
    });
    const parentId = parent.uid;

    // 8. Seed Student
    console.log("👶 Seeding Student...");
    const student = await studentService.createStudent({
      parentId,
      name: "Timmy Test",
      dob: "2015-05-20",
      medicalNote: "Peanut allergy",
    });
    const studentId = student.id;

    // 9. Seed Enrollment
    console.log("📝 Seeding Enrollment...");
    const enrollment = await enrollmentService.createEnrollment({
      studentId,
      programId,
      sessionId,
      amount: 250,
      enrollmentType: "Full",
    });
    const enrollmentId = enrollment.id;

    // 10. Seed Payment
    console.log("💰 Seeding Payment...");
    const payment = await paymentService.initiatePayment({
      enrollmentId,
      parentId,
      amount: 250,
      method: "cash",
    });
    // Verify it
    await paymentService.verifyPayment(payment.transactionId);

    console.log("\n✅ SUCCESS: Full system record chain created!");
    console.log("--------------------------------------------");
    console.log(`Term ID:       ${termId}`);
    console.log(`Category ID:   ${categoryId}`);
    console.log(`Level ID:      ${levelId}`);
    console.log(`Program ID:    ${programId}`);
    console.log(`Session ID:    ${sessionId}`);
    console.log(`Admin UID:     ${adminUid}`);
    console.log(`Parent UID:    ${parentId}`);
    console.log(`Student ID:    ${studentId}`);
    console.log(`Enrollment ID: ${enrollmentId}`);
    console.log(`Transaction:   ${payment.transactionId}`);
    console.log("--------------------------------------------");
  } catch (error) {
    console.error("\n❌ SEEDING FAILED:", error.message);
    if (error.stack) console.error(error.stack);
  }

  process.exit(0);
}

seedFullSystem();

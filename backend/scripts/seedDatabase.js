const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

// Initialize Firebase Admin
// Note: This requires GOOGLE_APPLICATION_CREDENTIALS environment variable or
// running in an environment already authenticated with gcloud auth application-default login
const app = admin.initializeApp();
const db = getFirestore(app, "registration"); // Target the 'registration' database

async function seedDatabase() {
  console.log("Seeding database 'registration'...");

  // 1. Create Users
  const usersRef = db.collection("users");
  const studentId = "student_001";
  await usersRef.doc(studentId).set({
    email: "student@example.com",
    role: "student",
    name: "John Doe",
    createdAt: new Date().toISOString(),
    profileURL: "https://example.com/profiles/john.jpg",
  });
  console.log("Created user: John Doe");

  // 2. Create Courses
  const coursesRef = db.collection("courses");
  const courseId = "course_101";
  await coursesRef.doc(courseId).set({
    title: "Introduction to Computer Science",
    description: "Basic concepts of programming and algorithms.",
    instructor: "Prof. Smith",
    schedule: {
      days: ["Mon", "Wed"],
      time: "10:00 AM - 11:30 AM",
    },
    capacity: 30,
    enrolledCount: 0,
  });
  console.log("Created course: CS101");

  // 3. Create Registrations
  const registrationsRef = db.collection("registrations");
  await registrationsRef.add({
    studentId: studentId,
    courseId: courseId,
    status: "pending",
    paymentStatus: "unpaid",
    registeredAt: new Date().toISOString(),
  });
  console.log("Created registration for John Doe in CS101");

  console.log("Database seeded successfully!");
}

seedDatabase().catch(console.error);

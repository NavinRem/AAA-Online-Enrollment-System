const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

if (admin.apps.length === 0) {
  admin.initializeApp({
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

const DATABASE_ID = "(default)";
const db = getFirestore(DATABASE_ID);

const COLLECTIONS = {
  ADMIN: "admins",
  PARENT: "parents",
  STUDENT: "students",
  ENROLLMENT: "enrollments",
  PROGRAM: "programs",
  SESSION: "sessions",
  TERM: "terms",
  CATEGORY: "categories",
  LEVEL: "levels",
  PAYMENT: "payments",
  ATTENDANCE: "attendance",
  PROGRESS: "progress",
  UPLOAD: "uploads",
  REQUEST: "requests",
};

module.exports = {
  db,
  COLLECTIONS,
  DATABASE_ID,
};

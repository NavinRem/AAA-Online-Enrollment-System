const { getFirestore } = require("firebase-admin/firestore");

/**
 * Centralized Firestore configuration.
 * Change DATABASE_ID to "(default)" or your specific DB ID.
 */
const DATABASE_ID = "registration";
const db = getFirestore(DATABASE_ID);

/**
 * Single Source of Truth for all Collection Names.
 * Standardizing these prevents pluralization bugs (enrollment vs enrollments)
 * and makes global renaming easy.
 */
const COLLECTIONS = {
  USER: "user",
  STUDENT: "student",
  ENROLLMENT: "enrollment",
  COURSE: "courses",      // Standard plural used in your project
  SESSION: "session",
  TERM: "terms",          // Standard plural used in your project
  CATEGORY: "categories", // Standard plural used in your project
  LEVEL: "levels",        // Standard plural used in your project
  PAYMENT: "payment",
  ATTENDANCE: "attendance",
  PROGRESS: "progress",
  UPLOAD: "uploads",
  REQUEST: "requests"
};

module.exports = {
  db,
  COLLECTIONS,
  DATABASE_ID
};

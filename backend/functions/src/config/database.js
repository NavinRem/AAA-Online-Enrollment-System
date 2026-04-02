const { getFirestore } = require("firebase-admin/firestore");

/**
 * Centralized Firestore configuration.
 * Change DATABASE_ID to "(default)" or your specific DB ID.
 */
const DATABASE_ID = "(default)";
const db = getFirestore(DATABASE_ID);

/**
 * Single Source of Truth for all Collection Names.
 * Standardizing these prevents pluralization bugs (enrollment vs enrollments)
 * and makes global renaming easy.
 */
const COLLECTIONS = {
  USER: "users",
  PARENT: "parents",
  GUARDIAN: "guardians",
  ADMIN: "admins",
  TEACHER: "teachers",
  STUDENT: "students",
  ENROLLMENT: "enrollments",
  PROGRAM: "programs",      // Renamed from 'courses'
  SESSION: "sessions",
  TERM: "terms",          // Standard plural used in your project
  CATEGORY: "categories", // Standard plural used in your project
  LEVEL: "levels",        // Standard plural used in your project
  PAYMENT: "payments",
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

const admin = require('firebase-admin')
const { getFirestore } = require('firebase-admin/firestore')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })

if (process.env.INTERNAL_FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST =
    process.env.INTERNAL_FIRESTORE_EMULATOR_HOST
}
if (process.env.INTERNAL_AUTH_EMULATOR_HOST) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST =
    process.env.INTERNAL_AUTH_EMULATOR_HOST
}

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: process.env.INTERNAL_PROJECT_ID,
    storageBucket: process.env.INTERNAL_STORAGE_BUCKET,
  })
}

const db = getFirestore()
db.settings({ ignoreUndefinedProperties: true })

const COLLECTIONS = {
  ADMIN: 'admins',
  BRANCH: 'branches',
  CATEGORY: 'categories',
  CLASS: 'classes',
  // ...
  ENROLLMENT: 'enrollments',
  LEVEL: 'levels',
  PARENT: 'parents',
  PAYMENT: 'payments',
  PROGRAM: 'programs',
  SCHEDULE: 'schedules',
  STUDENT: 'students',
  TEACHER: 'teachers',
  TERM: 'terms',
  TRIAL: 'trials',
}

module.exports = {
  db,
  COLLECTIONS,
}

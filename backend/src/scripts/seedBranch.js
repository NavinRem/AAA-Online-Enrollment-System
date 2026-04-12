const admin = require('firebase-admin')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../.env') })

// Ensure Project ID is available for firebase-admin
process.env.GOOGLE_CLOUD_PROJECT = process.env.INTERNAL_PROJECT_ID

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: process.env.INTERNAL_PROJECT_ID,
    storageBucket: process.env.INTERNAL_STORAGE_BUCKET,
  })
}

const { db, COLLECTIONS } = require('../config/database')

/**
 * Script to seed a new branch.
 * Usage: node seedBranch.js <name> <abbr> <location>
 * Example: node seedBranch.js "Main Campus" "MC" "123 Main St, City"
 */
async function seedBranch() {
  process.env.FIRESTORE_EMULATOR_HOST =
    process.env.INTERNAL_FIRESTORE_EMULATOR_HOST
  process.env.FIREBASE_AUTH_EMULATOR_HOST =
    process.env.INTERNAL_AUTH_EMULATOR_HOST

  const args = process.argv.slice(2)
  const branchName = args[0] || process.env.NEW_BRANCH_NAME
  const branchAbbr = (args[1] || process.env.NEW_BRANCH_ABBR || '')
    .toUpperCase()
    .trim()
  const branchLocation = args[2] || process.env.NEW_BRANCH_LOCATION || ''

  if (!branchName || !branchAbbr) {
    console.error('❌ Usage: node seedBranch.js <name> <abbr> [location]')
    console.error(
      'Alternatively, set NEW_BRANCH_NAME and NEW_BRANCH_ABBR in .env',
    )
    process.exit(1)
  }

  console.log(`🏢 Initializing Branch: ${branchName} (${branchAbbr})...`)

  try {
    const branchRef = db.collection(COLLECTIONS.BRANCH).doc(branchAbbr)
    const doc = await branchRef.get()

    if (doc.exists) {
      console.log(
        `⚠️ Branch "${branchAbbr}" already exists. Skipping initialization to prevent data overwrite.`,
      )
      console.log('👉 Current Content:', doc.data())
      process.exit(0)
    }

    const branchData = {
      name: branchName,
      abbr: branchAbbr,
      location: branchLocation,
      studentCount: 0,
      programCount: 0,
      classCount: 0,
      newTodayCount: 0,
      totalRevenue: 0,
      pendingRevenue: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await branchRef.set(branchData)
    console.log(
      `✅ Branch "${branchName}" successfully seeded at ID: ${branchAbbr}`,
    )
  } catch (error) {
    console.error('❌ Seeding failed:', error.message)
  }

  process.exit(0)
}

seedBranch()

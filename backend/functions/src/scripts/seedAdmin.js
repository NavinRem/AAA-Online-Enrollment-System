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
 * Script to seed the first Administrator account.
 * This should be run ONCE after a fresh system wipe.
 */
async function seedAdmin() {
  // Map INTERNAL_ vars to the SDK-expected emulator host vars
  process.env.FIRESTORE_EMULATOR_HOST =
    process.env.INTERNAL_FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080'
  process.env.FIREBASE_AUTH_EMULATOR_HOST =
    process.env.INTERNAL_AUTH_EMULATOR_HOST || '127.0.0.1:9099'

  const adminData = {
    email: process.env.INITIAL_ADMIN_EMAIL,
    password: process.env.INITIAL_ADMIN_PASSWORD,
    name: process.env.INITIAL_ADMIN_NAME,
    profileURL: process.env.INITIAL_ADMIN_PROFILE_URL || '',
    role: 'admin',
    status: 'Active',
  }

  console.log(`🛡️ Initializing Admin account: ${adminData.email}...`)

  try {
    // 1. Create Auth User
    let userRecord
    try {
      userRecord = await admin.auth().getUserByEmail(adminData.email)
      console.log('ℹ️ Admin user already exists in Auth. Updating claims...')
    } catch (err) {
      userRecord = await admin.auth().createUser({
        email: adminData.email,
        password: adminData.password,
        displayName: adminData.name,
      })
      console.log('✅ Admin user created in Auth.')
    }

    const { uid } = userRecord

    // 2. Set Admin Custom Claims
    await admin.auth().setCustomUserClaims(uid, { role: 'admin' })

    // 3. Save to the new 'admins' collection
    const adminRef = db.collection(COLLECTIONS.ADMIN).doc(uid)
    await adminRef.set(
      {
        email: adminData.email,
        name: adminData.name,
        role: 'admin',
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        profileURL: adminData.profileURL,
      },
      { merge: true },
    )

    console.log(`✅ Admin account fully seeded at UID: ${uid}`)
    console.log(`👉 Collection: ${COLLECTIONS.ADMIN}`)
  } catch (error) {
    console.error('❌ Seeding failed:', error.message)
  }

  process.exit(0)
}

seedAdmin()

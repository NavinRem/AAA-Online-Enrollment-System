// Map INTERNAL_ vars to the SDK-expected emulator host vars
process.env.FIRESTORE_EMULATOR_HOST =
  process.env.INTERNAL_FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080'

const { db, COLLECTIONS } = require('../config/database')

async function verifySessions() {
  console.log('🔍 Verifying Session Branch Data...')

  try {
    const snapshot = await db.collection(COLLECTIONS.SESSION).limit(5).get()

    if (snapshot.empty) {
      console.log('⚠️ No sessions found.')
    } else {
      snapshot.forEach((doc) => {
        const data = doc.data()
        console.log(
          `Session ${doc.id}: branch = ${data.branch ? `${data.branch.name} (${data.branch.abbr})` : 'MISSING'}`,
        )
      })
    }
  } catch (error) {
    console.error('❌ Verification failed:', error.message)
  }

  process.exit(0)
}

verifySessions()

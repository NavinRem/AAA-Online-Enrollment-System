/**
 * clearClasses.js
 * Clears all documents from the 'classes' collection in the Firestore Emulator.
 *
 * Run with:
 *   node src/scripts/clearClasses.js
 *
 * The script uses the same database config as the backend, so it automatically
 * targets the local Firestore Emulator (127.0.0.1:8080) based on the .env file.
 */

const { db, COLLECTIONS } = require('../config/database')

const BATCH_SIZE = 500 // Firestore batch limit

async function deleteCollection(collectionName) {
  const collRef = db.collection(collectionName)
  let totalDeleted = 0

  while (true) {
    const snapshot = await collRef.limit(BATCH_SIZE).get()

    if (snapshot.empty) break

    const batch = db.batch()
    snapshot.docs.forEach((doc) => batch.delete(doc.ref))
    await batch.commit()

    totalDeleted += snapshot.size
    console.log(`  ✓ Deleted ${totalDeleted} documents so far...`)
  }

  return totalDeleted
}

async function main() {
  console.log('===========================================')
  console.log(' AAA Enrollment – Clear Class Data Script ')
  console.log('===========================================')
  console.log(
    `Targeting Firestore Emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`,
  )
  console.log(`Collection: ${COLLECTIONS.CLASS}`)
  console.log('-------------------------------------------')

  try {
    const count = await deleteCollection(COLLECTIONS.CLASS)

    if (count === 0) {
      console.log('No class documents found. Collection is already empty.')
    } else {
      console.log(`\n✅ Done. Successfully deleted ${count} class document(s).`)
    }
  } catch (err) {
    console.error('\n❌ Error clearing classes:', err.message)
    process.exit(1)
  }

  process.exit(0)
}

main()

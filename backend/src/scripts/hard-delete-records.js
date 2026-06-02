const { db, COLLECTIONS } = require('../config/database')

async function hardDeleteRecords() {
  console.log('Starting hard delete of all soft-deleted records...')
  
  let totalDeleted = 0
  const batchLimit = 500

  for (const [, collectionName] of Object.entries(COLLECTIONS)) {
    console.log(`\nScanning collection: ${collectionName}...`)
    try {
      const snap = await db.collection(collectionName).where('isDeleted', '==', true).get()
      
      if (snap.empty) {
        console.log(`  No deleted records found in ${collectionName}.`)
        continue
      }

      console.log(`  Found ${snap.size} deleted records in ${collectionName}. Deleting...`)
      
      let batch = db.batch()
      let writes = 0
      let colDeleted = 0

      for (const doc of snap.docs) {
        batch.delete(doc.ref)
        writes++
        
        if (writes >= batchLimit) {
          await batch.commit()
          colDeleted += writes
          console.log(`  ...deleted ${colDeleted} / ${snap.size}`)
          batch = db.batch()
          writes = 0
        }
      }

      if (writes > 0) {
        await batch.commit()
        colDeleted += writes
      }

      console.log(`  Successfully deleted ${colDeleted} records from ${collectionName}.`)
      totalDeleted += colDeleted

    } catch (err) {
      console.error(`  Error processing collection ${collectionName}:`, err.message)
    }
  }

  console.log('\n=========================================')
  console.log(`Hard delete complete! Permanently removed ${totalDeleted} records across all modules.`)
  console.log('=========================================')
}

hardDeleteRecords().then(() => process.exit(0)).catch((err) => {
  console.error('Error during hard delete:', err)
  process.exit(1)
})

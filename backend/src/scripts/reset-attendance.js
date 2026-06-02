const { db } = require('../config/database')

async function resetAttendance() {
  console.log('Starting full attendance reset...')
  let totalDeleted = 0
  const batchLimit = 500
  let batch = db.batch()
  let writes = 0

  const executeBatch = async () => {
    if (writes > 0) {
      await batch.commit()
      totalDeleted += writes
      console.log(`Deleted ${writes} documents... (Total: ${totalDeleted})`)
      batch = db.batch()
      writes = 0
    }
  }

  // 1. Delete all documents in nested collections named 'attendance'
  console.log('Finding all nested "attendance" records (legacy class level & new schedule level)...')
  const attendanceGroupSnap = await db.collectionGroup('attendance').get()
  console.log(`Found ${attendanceGroupSnap.size} records.`)

  for (const doc of attendanceGroupSnap.docs) {
    batch.delete(doc.ref)
    writes++
    if (writes >= batchLimit) await executeBatch()
  }

  // 2. Delete all documents in old top-level 'attendances' collection
  console.log('Finding all top-level "attendances" records (oldest version)...')
  const attendancesSnap = await db.collection('attendances').get()
  console.log(`Found ${attendancesSnap.size} records.`)

  for (const doc of attendancesSnap.docs) {
    batch.delete(doc.ref)
    writes++
    if (writes >= batchLimit) await executeBatch()
  }

  await executeBatch()

  console.log(`=========================================`)
  console.log(`Reset complete! Successfully completely wiped ${totalDeleted} attendance records.`)
  console.log(`=========================================`)
}

resetAttendance().then(() => process.exit(0)).catch((err) => {
  console.error('Error resetting attendance:', err)
  process.exit(1)
})

const { db, COLLECTIONS } = require('../src/config/database')

async function migrateClasses() {
  console.log('Starting Class Status Migration...')
  const classesSnap = await db.collection(COLLECTIONS.CLASS).get()
  let updatedCount = 0

  for (const doc of classesSnap.docs) {
    const data = doc.data()
    let needsUpdate = false
    const updates = {}

    if (data.status !== undefined) {
      updates.status = require('firebase-admin').firestore.FieldValue.delete()
      needsUpdate = true
    }

    if (data.schedules && Array.isArray(data.schedules)) {
      const newSchedules = data.schedules.map((s) => {
        let changed = false
        const newSched = { ...s }
        if (newSched.capacity === undefined) {
          newSched.capacity = data.program?.capacity || 20
          changed = true
        }
        if (newSched.status === undefined) {
          newSched.status = 'active'
          changed = true
        }
        if (changed) needsUpdate = true
        return newSched
      })

      if (needsUpdate) {
        updates.schedules = newSchedules
      }
    }

    if (needsUpdate) {
      await doc.ref.update(updates)
      console.log(`Updated class: ${doc.id}`)
      updatedCount++
    }
  }

  console.log(`Migration complete. Updated ${updatedCount} classes.`)
  process.exit(0)
}

migrateClasses().catch(console.error)

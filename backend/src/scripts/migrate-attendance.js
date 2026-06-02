const { db, COLLECTIONS } = require('../config/database')

async function migrate() {
  console.log('Starting attendance migration...')

  // 1. Load enrollments to build a lookup for scheduleId & branchId
  console.log('Loading enrollments...')
  const enrollmentsSnap = await db.collection(COLLECTIONS.ENROLLMENT || 'enrollments').get()
  const enrollmentMap = new Map() // key: studentId_classId_termId, value: { scheduleId, branchId }
  enrollmentsSnap.forEach(doc => {
    const data = doc.data()
    if (!data.isDeleted) {
      const studentId = data.studentId
      const classId = data.classId
      const termId = data.termId
      const scheduleId = data.scheduleId || data.class?.schedule?.id
      const branchId = data.branchId || data.class?.branch?.id
      if (studentId && classId && termId) {
        enrollmentMap.set(`${studentId}_${classId}_${termId}`, { scheduleId, branchId })
      }
    }
  })
  console.log(`Loaded ${enrollmentMap.size} active student enrollments for lookup.`)

  // 2. Load classes as fallback
  console.log('Loading classes...')
  const classesSnap = await db.collection(COLLECTIONS.CLASS || 'classes').get()
  const classMap = new Map() // key: classId, value: { scheduleId, branchId }
  classesSnap.forEach(doc => {
    const data = doc.data()
    if (!data.isDeleted) {
      const scheduleId = data.schedules?.[0]?.id || data.scheduleIds?.[0] || 'default'
      const branchId = data.branches?.[0]?.id || data.branchIds?.[0] || 'default'
      classMap.set(doc.id, { scheduleId, branchId })
    }
  })

  // 3. Load terms as fallback
  console.log('Loading terms...')
  const termsSnap = await db.collection(COLLECTIONS.TERM || 'terms').get()
  const currentTermId = termsSnap.docs.find(doc => doc.data().isCurrent)?.id || termsSnap.docs[0]?.id || 'default'

  // 4. Fetch all attendance records
  console.log('Loading attendance records...')
  const attendancesSnap = await db.collection('attendances').get()
  console.log(`Found ${attendancesSnap.size} legacy attendance records to process.`)

  let writes = 0
  let deletes = 0
  let batch = db.batch()
  let batchCount = 0

  const commitBatchIfNeeded = async (force = false) => {
    if (batchCount >= 400 || (force && batchCount > 0)) {
      console.log(`Committing batch of ${batchCount} operations...`)
      await batch.commit()
      batch = db.batch()
      batchCount = 0
    }
  }

  for (const doc of attendancesSnap.docs) {
    const data = doc.data()
    const legacyRef = doc.ref

    // Parse records into list of atomic student attendance entries
    const entries = []

    if (data.statuses) {
      // Type A: legacy map format
      const classId = data.classId || 'default'
      const rawSessionId = data.sessionId || '1'
      const termId = data.termId || currentTermId

      for (const [studentId, status] of Object.entries(data.statuses)) {
        entries.push({
          classId,
          termId,
          studentId,
          status,
          rawSessionId,
          updatedAt: data.updatedAt || new Date().toISOString(),
          history: data.history || [{ status, changedAt: data.updatedAt || new Date().toISOString() }]
        })
      }
    } else if (data.studentId && data.status) {
      // Type B/C: atomic formats
      entries.push({
        classId: data.classId,
        termId: data.termId || currentTermId,
        studentId: data.studentId,
        status: data.status,
        rawSessionId: data.sessionId,
        updatedAt: data.updatedAt || new Date().toISOString(),
        history: data.history || [{ status: data.status, changedAt: data.updatedAt || new Date().toISOString() }]
      })
    }

    // Now write each entry to the new nested subcollection
    for (const entry of entries) {
      const lookupKey = `${entry.studentId}_${entry.classId}_${entry.termId}`
      const info = enrollmentMap.get(lookupKey) || classMap.get(entry.classId) || { scheduleId: 'default', branchId: 'default' }
      const scheduleId = info.scheduleId || 'default'
      const branchId = info.branchId || 'default'

      // Standardize sessionId format to: termId_branchId_sessionIndex
      let cleanSessionId = entry.rawSessionId
      if (typeof cleanSessionId === 'number' || !String(cleanSessionId).includes('_')) {
        // e.g. 1 or "session-1"
        const sessionIndex = String(cleanSessionId).replace('session-', '')
        cleanSessionId = `${entry.termId}_${branchId}_${sessionIndex}`
      }

      const docId = `${cleanSessionId}_${entry.studentId}`
      const newRef = db
        .collection('terms')
        .doc(entry.termId)
        .collection('classes')
        .doc(entry.classId)
        .collection('schedules')
        .doc(scheduleId)
        .collection('attendance')
        .doc(docId)

      const newData = {
        classId: entry.classId,
        termId: entry.termId,
        scheduleId,
        sessionId: cleanSessionId,
        studentId: entry.studentId,
        status: entry.status,
        updatedAt: entry.updatedAt,
        history: entry.history
      }

      batch.set(newRef, newData, { merge: true })
      batchCount++
      writes++
      await commitBatchIfNeeded()
    }

    // Delete the legacy document
    batch.delete(legacyRef)
    batchCount++
    deletes++
    await commitBatchIfNeeded()
  }

  // Force commit remaining operations
  await commitBatchIfNeeded(true)

  console.log(`Migration complete! Successfully migrated ${writes} records and deleted ${deletes} legacy documents.`)
}

migrate().then(() => process.exit(0)).catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})

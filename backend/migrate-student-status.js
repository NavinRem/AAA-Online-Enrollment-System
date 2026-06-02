const { db } = require('./src/config/database')

async function migrateStudentStatus() {
  console.log('Starting migration...')
  
  // 1. Get all enrollments that are seat taking (paid, success, active, confirmed)
  const seatTakingStatuses = ['active', 'confirmed', 'paid', 'success']
  const enrollmentsSnap = await db.collection('enrollments').get()
  
  const activeStudentIds = new Set()
  
  enrollmentsSnap.forEach(doc => {
    const data = doc.data()
    if (!data.isDeleted && data.status && seatTakingStatuses.includes(String(data.status).toLowerCase())) {
      if (data.studentId) activeStudentIds.add(data.studentId)
    }
  })
  
  console.log(`Found ${activeStudentIds.size} students with active enrollments.`)
  
  // 2. Fetch those students and update their status to Active if it's currently Inactive
  const writes = []
  const batchArray = []
  let currentBatch = db.batch()
  let batchCount = 0
  
  for (const studentId of activeStudentIds) {
    const studentRef = db.collection('students').doc(studentId)
    const doc = await studentRef.get()
    
    if (doc.exists) {
      const data = doc.data()
      if (String(data.status).toLowerCase() === 'inactive') {
        currentBatch.update(studentRef, { 
          status: 'Active',
          updatedAt: new Date().toISOString()
        })
        writes.push(studentId)
        batchCount++
        
        if (batchCount === 400) {
          batchArray.push(currentBatch)
          currentBatch = db.batch()
          batchCount = 0
        }
      }
    }
  }
  
  if (batchCount > 0) {
    batchArray.push(currentBatch)
  }
  
  console.log(`Preparing to update ${writes.length} students to Active status.`)
  
  for (const batch of batchArray) {
    await batch.commit()
  }
  
  console.log('Migration complete!')
}

migrateStudentStatus().then(() => process.exit(0)).catch(err => {
  console.error(err)
  process.exit(1)
})

const { db, COLLECTIONS } = require('../src/config/database')
const termService = require('../src/services/termService')

async function migrate() {
  console.log('Starting Term Migration: Merging branch-specific terms into unified records...')
  
  // 1. Fetch all active terms
  const termsSnap = await db.collection(COLLECTIONS.TERM).get()
  const terms = termsSnap.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(t => !t.isDeleted)
  
  // 2. Group terms by their common name (e.g. "Term 2 2026")
  const termGroups = {}
  terms.forEach(t => {
    const normalizedName = t.name.trim()
    if (!termGroups[normalizedName]) termGroups[normalizedName] = []
    termGroups[normalizedName].push(t)
  })
  
  for (const name in termGroups) {
    const group = termGroups[name]
    if (group.length <= 1) continue
    
    console.log(`\n--- Merging ${group.length} records for "${name}" ---`)
    
    // Pick the first one as master
    const master = group[0]
    const others = group.slice(1)
    
    let mergedBranchIds = [...(master.branchIds || (master.branchId ? [master.branchId] : []))]
    let mergedBranchSettings = [...(master.branchSettings || [])]
    
    // Initialize master branch settings if empty
    if (mergedBranchSettings.length === 0 && mergedBranchIds.length > 0) {
      mergedBranchIds.forEach(id => {
        mergedBranchSettings.push({
          branchId: id,
          startDate: master.startDate,
          endDate: master.endDate,
          status: master.status || 'upcoming'
        })
      })
    }
    
    let mergedOfferings = [...(master.offerings || [])]
    
    for (const other of others) {
      const otherBranchIds = other.branchIds || (other.branchId ? [other.branchId] : [])
      
      console.log(`  Merging ${other.id} (${otherBranchIds.join(', ')}) into ${master.id}`)
      
      // Add missing branch IDs and their settings
      otherBranchIds.forEach(id => {
        if (!mergedBranchIds.includes(id)) {
          mergedBranchIds.push(id)
          mergedBranchSettings.push({
            branchId: id,
            startDate: other.startDate,
            endDate: other.endDate,
            status: other.status || 'upcoming'
          })
        }
      })
      
      // Collect offerings
      mergedOfferings = mergedOfferings.concat(other.offerings || [])
      
      // Update enrollments that refer to the old term ID
      const enrollSnap = await db.collection(COLLECTIONS.ENROLLMENT).where('termId', '==', other.id).get()
      if (!enrollSnap.empty) {
        console.log(`    Updating ${enrollSnap.size} enrollments...`)
        const batch = db.batch()
        enrollSnap.forEach(doc => {
          batch.update(doc.ref, { 
            termId: master.id,
            // Deep update for snapshots
            'term.id': master.id,
            'class.term.id': master.id,
            updatedAt: new Date().toISOString()
          })
        })
        await batch.commit()
      }
      
      // Soft delete the redundant term
      await db.collection(COLLECTIONS.TERM).doc(other.id).update({
        isDeleted: true,
        mergedInto: master.id,
        updatedAt: new Date().toISOString()
      })
    }
    
    // Update the Master record with consolidated data
    await db.collection(COLLECTIONS.TERM).doc(master.id).update({
      branchIds: mergedBranchIds,
      branchSettings: mergedBranchSettings,
      offerings: mergedOfferings,
      updatedAt: new Date().toISOString()
    })
    
    // Force a sync for all enrollments under this unified term 
    // to ensure snapshots have correct branch-specific dates
    const finalMasterDoc = await db.collection(COLLECTIONS.TERM).doc(master.id).get()
    await termService.syncEnrollmentsForTerm(master.id, { id: master.id, ...finalMasterDoc.data() })
    
    console.log(`  Done: Unified "${name}" at ID: ${master.id}`)
  }
  
  console.log('\nMigration Complete! All duplicate terms merged.')
  process.exit(0)
}

migrate().catch(err => {
  console.error('\nMigration Failed:', err)
  process.exit(1)
})

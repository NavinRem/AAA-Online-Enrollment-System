const { db } = require('../config/database')

/**
 * Executes a large number of Firestore updates by splitting them into batches of 500.
 * @param {Array<{ref: FirebaseFirestore.DocumentReference, data: Object}>} operations 
 * @returns {Promise<void>}
 */
async function chunkedUpdate(operations) {
  const CHUNK_SIZE = 450 // Use 450 to be safe and allow for metadata/overhead
  
  for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
    const batch = db.batch()
    const chunk = operations.slice(i, i + CHUNK_SIZE)
    
    chunk.forEach(({ ref, data }) => {
      batch.update(ref, data)
    })
    
    await batch.commit()
  }
}

/**
 * Executes a large number of Firestore deletions by splitting them into batches of 500.
 * @param {Array<FirebaseFirestore.DocumentReference>} refs 
 * @returns {Promise<void>}
 */
async function chunkedDelete(refs) {
  const CHUNK_SIZE = 450
  
  for (let i = 0; i < refs.length; i += CHUNK_SIZE) {
    const batch = db.batch()
    const chunk = refs.slice(i, i + CHUNK_SIZE)
    
    chunk.forEach((ref) => {
      batch.delete(ref)
    })
    
    await batch.commit()
  }
}

module.exports = {
  chunkedUpdate,
  chunkedDelete,
}

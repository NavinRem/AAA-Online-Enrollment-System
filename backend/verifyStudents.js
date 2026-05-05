
const { db, COLLECTIONS } = require('./src/config/database');

async function auditStudents() {
  console.log('--- Student Data Audit ---');
  const snapshot = await db.collection(COLLECTIONS.STUDENT).get();
  
  let total = 0;
  let corrupt = 0;
  let emptyName = 0;
  let missingParent = 0;

  snapshot.forEach(doc => {
    total++;
    const data = doc.data();
    const isDeleted = data.isDeleted === true || data.status === 'deleted';
    
    if (isDeleted) {
      console.log(`[DELETED] ID: ${doc.id} (Name: ${data.name || 'N/A'})`);
      corrupt++; // Counting deleted as "potential clutter" for now
    }

    if (!data.name || data.name.trim() === '') {
      emptyName++;
      console.log(`[EMPTY NAME] ID: ${doc.id}`);
    }
    
    if (!data.parentId) {
      missingParent++;
      console.log(`[MISSING PARENT] ID: ${doc.id} (Name: ${data.name || 'N/A'})`);
    }
  });

  console.log('\n--- Summary ---');
  console.log(`Total Students: ${total}`);
  console.log(`Corrupt (No Name): ${emptyName}`);
  console.log(`Missing Parent: ${missingParent}`);
  
  if (emptyName === 0 && missingParent === 0) {
    console.log('\n✅ No data integrity issues found in the current collection.');
  } else {
    console.log('\n⚠️ Issues found. Proceed with implementation plan.');
  }
}

auditStudents().catch(console.error);

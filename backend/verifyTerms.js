const { db, COLLECTIONS } = require('./src/config/database');
const dateHelper = require('./src/utils/dateHelper');

async function verifyTerms() {
  console.log('--- TERM DATA INTEGRITY AUDIT ---');
  try {
    const snapshot = await db.collection(COLLECTIONS.TERM).get();
    let issuesFound = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.isDeleted) return;

      const calculatedStatus = dateHelper.calculateStatus(data.startDate, data.endDate);
      const expectedEndDate = dateHelper.calculateEndDate(data.startDate, data.totalSessions || 11);

      const statusMismatch = data.status !== calculatedStatus;
      const dateMismatch = data.endDate !== expectedEndDate;

      if (statusMismatch || dateMismatch) {
        issuesFound++;
        console.log(`[ISSUE] Term: ${data.name} (${doc.id})`);
        if (statusMismatch) console.log(`  - Status Mismatch: Stored="${data.status}", Calculated="${calculatedStatus}"`);
        if (dateMismatch) console.log(`  - EndDate Mismatch: Stored="${data.endDate}", Calculated="${expectedEndDate}"`);
      }
    });

    if (issuesFound === 0) {
      console.log('✅ All terms have consistent dates and statuses.');
    } else {
      console.log(`\nFound ${issuesFound} terms with inconsistencies.`);
    }
  } catch (err) {
    console.error('Audit failed:', err);
  }
}

verifyTerms();

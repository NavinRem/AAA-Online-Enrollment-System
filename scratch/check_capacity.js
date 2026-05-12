const admin = require('firebase-admin');

// Point to the emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'aaa-online-registration-e3833'
  });
}

const db = admin.firestore();

async function checkData() {
  console.log('--- Classes ---');
  const classSnap = await db.collection('classes').get();
  classSnap.forEach(doc => {
    const data = doc.data();
    console.log(`Class: ${doc.id} (${data.program?.name})`);
    console.log('Schedules:', JSON.stringify(data.schedules, null, 2));
  });

  console.log('\n--- Terms ---');
  const termSnap = await db.collection('terms').get();
  termSnap.forEach(doc => {
    const data = doc.data();
    console.log(`Term: ${doc.id} (${data.name})`);
    (data.offerings || []).forEach(off => {
      console.log(`  Offering: Class ${off.classId}, Schedule ${off.scheduleId}, Capacity: ${off.capacity}`);
    });
  });
}

checkData().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});

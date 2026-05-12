const admin = require('firebase-admin');

// Point to the emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'aaa-online-registration-e3833'
  });
}

const db = admin.firestore();

async function forceSync() {
  console.log('Force syncing all classes with terms...');
  const classSnap = await db.collection('classes').get();
  const termSnap = await db.collection('terms').get();
  
  const terms = termSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const writes = [];

  for (const classDoc of classSnap.docs) {
    const classData = { id: classDoc.id, ...classDoc.data() };
    console.log(`Syncing Class: ${classData.id} (${classData.program?.name})`);

    terms.forEach(term => {
      let changed = false;
      const offerings = (term.offerings || []).map(off => {
        if (off.classId !== classData.id) return off;

        const scheduleSnapshot = (classData.schedules || []).find(
          s => String(s.id) === String(off.scheduleId)
        );

        if (scheduleSnapshot) {
          const newCapacity = scheduleSnapshot.capacity || 20;
          if (off.capacity !== newCapacity || JSON.stringify(off.schedule) !== JSON.stringify(scheduleSnapshot)) {
            changed = true;
            return {
              ...off,
              schedule: scheduleSnapshot,
              capacity: newCapacity
            };
          }
        }
        return off;
      });

      if (changed) {
        console.log(`  Updating Term: ${term.id}`);
        writes.push(db.collection('terms').doc(term.id).update({ offerings, updatedAt: new Date().toISOString() }));
      }
    });
  }

  await Promise.all(writes);
  console.log('Done!');
}

forceSync().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});

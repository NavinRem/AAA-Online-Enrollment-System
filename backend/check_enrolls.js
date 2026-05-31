const admin = require('firebase-admin');
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

admin.initializeApp({
  projectId: 'aaa-online-registration-e3833'
});
const db = admin.firestore();

async function check() {
  const snaps = await db.collection('enrollments').get();
  console.log("Total enrollments:", snaps.size);
  snaps.forEach(doc => {
    const data = doc.data();
    console.log(doc.id, 'status:', data.status, 'paymentStatus:', data.paymentStatus, 'class:', data.classId, 'term:', data.termId, 'branch:', data.branchId, 'scheduleId:', data.scheduleId, 'has_class_obj:', !!data.class, 'class_schedule_id:', data.class?.schedule?.id);
  });
}
check();

const { db } = require('./src/config/database');
async function test() {
  const s = await db.collection('students').doc('vQWbHQfiQCS42QCWN9HW').get();
  console.log('Student:', s.data());
  process.exit(0);
}
test();

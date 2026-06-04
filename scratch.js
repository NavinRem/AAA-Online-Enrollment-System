const { db } = require('./backend/src/config/database');
async function run() {
  const snapshot = await db.collection('programs').get();
  snapshot.forEach(doc => {
    console.log(doc.id, doc.data().name);
  });
}
run();

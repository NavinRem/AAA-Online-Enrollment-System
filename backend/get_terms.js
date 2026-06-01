const { db } = require('./src/config/database');
async function run() {
  const t = await db.collection('terms').get();
  t.docs.forEach(doc => {
    console.log(doc.id, 'isCurrent:', doc.data().isCurrent);
  });
  process.exit();
}
run();

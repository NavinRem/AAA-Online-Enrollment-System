const { db } = require('./src/config/database');
async function test() {
  const p = await db.collection('parents').orderBy('createdAt', 'desc').limit(2).get();
  p.forEach(doc => console.log(doc.id, doc.data()));
  process.exit(0);
}
test();

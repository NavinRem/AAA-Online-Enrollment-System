const { db } = require('./src/config/database');
async function test() {
  const p = await db.collection('trials').orderBy('createdAt', 'desc').limit(2).get();
  p.forEach(doc => console.log(doc.id, JSON.stringify(doc.data(), null, 2)));
  process.exit(0);
}
test();

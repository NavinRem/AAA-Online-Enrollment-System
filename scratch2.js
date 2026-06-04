const { db } = require('./backend/src/config/database');
async function run() {
  const progs = await db.collection('programs').where('name', '==', 'Piano').get();
  if (progs.empty) return console.log('No Piano found');
  const programId = progs.docs[0].id;
  const classes = await db.collection('classes').where('programId', '==', programId).get();
  classes.forEach(doc => {
    const data = doc.data();
    console.log('Class:', doc.id, 'status:', data.status, 'Schedules:', JSON.stringify(data.schedules));
  });
}
run();

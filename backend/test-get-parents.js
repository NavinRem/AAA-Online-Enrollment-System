const parentService = require('./src/services/parentService');
async function test() {
  const parents = await parentService.getAllParents();
  const found = parents.find(p => p.name === 'poiu' || p.name === 'qwer');
  console.log('Found:', found);
  process.exit(0);
}
test();

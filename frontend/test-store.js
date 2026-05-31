import fs from 'fs';
const db = JSON.parse(fs.readFileSync('../backend/data/db.json', 'utf8'));
console.log("First trial:", JSON.stringify(db.trials[0], null, 2));

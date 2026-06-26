const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

const filesToCheck = [
  ...fs.readdirSync('src/utils').map(f => 'src/utils/' + f),
  ...fs.readdirSync('src/composables').map(f => 'src/composables/' + f)
];

const unused = [];
for (const file of filesToCheck) {
  if (!file.endsWith('.js')) continue;
  const basename = path.basename(file, '.js');
  try {
    const res = execSync(`grep -rn "${basename}" src/ | grep -v "${file}"`).toString();
    if (!res.trim()) unused.push(file);
  } catch (e) {
    unused.push(file);
  }
}
console.log('Unused files:', unused);

const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

function getAllFiles(dir, exts) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(file, exts));
    } else {
      if (exts.includes(path.extname(file))) {
        results.push(file);
      }
    }
  });
  return results;
}

const images = getAllFiles('src/assets', ['.png', '.jpg', '.svg']);
const unused = [];

for (const img of images) {
  const basename = path.basename(img);
  try {
    const res = execSync(`grep -rn "${basename}" src/ | grep -v "${img}"`).toString();
    if (!res.trim()) unused.push(img);
  } catch (e) {
    unused.push(img);
  }
}
console.log('Unused images:', unused);

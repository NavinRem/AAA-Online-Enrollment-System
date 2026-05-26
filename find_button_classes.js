const fs = require('fs');
const path = require('path');

function findVueFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      findVueFiles(path.join(dir, file), fileList);
    } else if (file.endsWith('.vue')) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const vueFiles = findVueFiles('./frontend/src');
let count = 0;

for (const file of vueFiles) {
  if (file.includes('AppButton.vue')) continue;
  const content = fs.readFileSync(file, 'utf-8');
  
  // Regex to match <AppButton ... > and extract class attribute if present
  // Matches <AppButton possibly multiline up to >
  const regex = /<AppButton([^>]*?)>/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const attrs = match[1];
    const classMatch = attrs.match(/class="([^"]*)"/);
    if (classMatch) {
      console.log(`File: ${file}\nClasses: ${classMatch[1]}\n`);
      count++;
    }
  }
}
console.log('Total AppButton with classes:', count);

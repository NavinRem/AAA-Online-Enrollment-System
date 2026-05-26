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

for (const file of vueFiles) {
  if (file.includes('AppButton.vue')) continue;
  let content = fs.readFileSync(file, 'utf-8');
  
  // Replace <AppButton ... class="bad-classes"> with <AppButton ... class="good-classes">
  // Since regex on HTML is hard, let's just do a string replacement for known bad classes
  
  const badClasses = [
    'rounded-xl shadow-lg shadow-primary/20',
    'rounded-xl shadow-md shadow-primary/10',
    'rounded-xl transition-all duration-300 group',
    'rounded-xl transition-all duration-300 group shadow-sm',
    '!bg-primary !text-white',
    '!bg-primary !text-white min-w-[240px]',
    '!text-white',
    '!bg-magenta',
    'flex-1 !py-4 !rounded-2xl',
    'flex-1 !py-4 !rounded-2xl shadow-lg shadow-primary/20',
    'rounded-xl transition-all duration-500 min-w-36',
    'font-bold',
    'px-8 font-bold',
    'px-8 font-black shadow-lg shadow-primary/20',
    '!text-primary font-black hover:bg-primary-soft rounded-lg',
    '!text-content-muted font-black hover:bg-outline-std/20 rounded-lg',
    'w-full mt-4 py-4 ui-btn-premium',
    'ui-btn-premium',
    'w-full font-bold shadow-lg shadow-error/5',
    'px-md py-3 rounded-xl shadow-lg shadow-primary/20 flex items-center gap-xs font-bold'
  ];

  let modified = false;
  for (const bad of badClasses) {
    const classStr1 = ` class="${bad}"`;
    if (content.includes(classStr1)) {
      content = content.split(classStr1).join('');
      modified = true;
    }
    const classStr2 = `class="${bad}"`;
    if (content.includes(classStr2)) {
      content = content.split(classStr2).join('');
      modified = true;
    }
  }

  // Handle template conditionals like :class="{ '!text-white shadow-md': branchFilter !== 'all', 'shadow-sm': branchFilter === 'all' }"
  // This was specific to Parents.vue but we already fixed it manually

  if (modified) {
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`Cleaned AppButton classes in: ${file}`);
  }
}

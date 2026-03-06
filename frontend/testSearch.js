const list = [
  {
    name: 'Rose Depp',
    parentName: 'Johnny Depp',
    status: 'Graduated',
    programs: [{ courseTitle: 'Piano' }],
    createdAt: '2026-02-15T15:45:31'
  },
  {
    name: 'Paul Tame',
    parentName: 'Karina Tame',
    status: 'Suspended',
    programs: [{ courseTitle: 'Piano' }],
    createdAt: '2026-02-15T15:45:31'
  }
];

const extractValues = (obj) => {
  if (!obj) return ''
  if (typeof obj !== 'object') return String(obj)
  return Object.values(obj)
    .map((val) => {
      if (val && typeof val === 'object') return extractValues(val)
      if (val !== null && val !== undefined) return String(val)
      return ''
    })
    .join(' ')
}

const item = list[0];
let searchableText = extractValues(item);
searchableText += ' ' + `${item.name} ${item.parentName}`;
const text = searchableText.toLowerCase();

console.log('Text:', text);
console.log('Matches "john suspended"?', ['john', 'suspended'].every(w => text.includes(w)));

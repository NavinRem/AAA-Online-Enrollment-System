const { db, COLLECTIONS } = require('../src/config/database');

function createSlug(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-');        // Replace multiple - with single -
}

async function generateSlugsForCollection(collectionName, nameField = 'name') {
  console.log(`Generating slugs for collection: ${collectionName}...`);
  const snapshot = await db.collection(collectionName).get();
  let updatedCount = 0;
  
  const batch = db.batch();
  let batchCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (!data.slug && data[nameField]) {
      const newSlug = createSlug(data[nameField]);
      batch.update(doc.ref, { slug: newSlug });
      updatedCount++;
      batchCount++;

      if (batchCount >= 400) {
        await batch.commit();
        batchCount = 0;
      }
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`Completed ${collectionName}. Added slugs to ${updatedCount} documents.`);
}

async function run() {
  try {
    await generateSlugsForCollection(COLLECTIONS.CATEGORY);
    await generateSlugsForCollection(COLLECTIONS.PROGRAM);
    await generateSlugsForCollection(COLLECTIONS.LEVEL);
    await generateSlugsForCollection(COLLECTIONS.TERM);
    console.log('All slugs generated successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

run();

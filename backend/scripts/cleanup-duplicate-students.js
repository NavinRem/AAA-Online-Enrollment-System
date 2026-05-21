/**
 * Cleanup Duplicate Student Records
 *
 * Finds and soft-deletes duplicate student records in Firestore.
 * Duplicates are identified by same: name + parentId + dob
 * The OLDEST record (by createdAt) is kept; newer duplicates are removed.
 *
 * Usage:
 *   node scripts/cleanup-duplicate-students.js          # Dry run (preview only)
 *   node scripts/cleanup-duplicate-students.js --apply   # Actually delete duplicates
 */

const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

// Set emulator hosts before initializing admin
if (process.env.INTERNAL_FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST =
    process.env.INTERNAL_FIRESTORE_EMULATOR_HOST
}

const admin = require('firebase-admin')

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: process.env.INTERNAL_PROJECT_ID,
    storageBucket: process.env.INTERNAL_STORAGE_BUCKET,
  })
}

const db = admin.firestore()
db.settings({ ignoreUndefinedProperties: true })

const APPLY = process.argv.includes('--apply')

async function findDuplicateStudents() {
  console.log('\n🔍 Scanning for duplicate student records...\n')

  const snapshot = await db.collection('students').get()
  const students = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((s) => s.isDeleted !== true && s.name && s.name.trim() !== '')

  console.log(`  Total active students: ${students.length}`)

  // Group by: name + parentId + dob
  const groups = {}
  for (const s of students) {
    const name = (s.name || '').trim().toLowerCase()
    const parentId = s.parentId || ''
    const dob = s.dob || ''
    const key = `${name}|${parentId}|${dob}`

    if (!groups[key]) groups[key] = []
    groups[key].push(s)

    // Debug: Log if we find similar names but different keys
    if (name.includes('yang') || name.includes('guang')) {
      console.log(
        `  🔍 Found potential match: "${s.name}" (ID: ${s.id}, DOB: ${dob}, Parent: ${parentId})`,
      )
    }
  }

  const duplicateGroups = Object.entries(groups).filter(
    ([, group]) => group.length > 1,
  )

  if (duplicateGroups.length === 0) {
    console.log('\n✅ No duplicate students found. Database is clean.\n')
    return []
  }

  console.log(`\n⚠️  Found ${duplicateGroups.length} duplicate group(s):\n`)

  const toDelete = []

  for (const [key, group] of duplicateGroups) {
    // Sort by createdAt ascending — keep the oldest
    group.sort(
      (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
    )

    const keep = group[0]
    const duplicates = group.slice(1)

    console.log(
      `  📌 "${keep.name}" (DOB: ${keep.dob || 'N/A'}, Parent: ${keep.parentId || 'N/A'})`,
    )
    console.log(`     ✅ KEEP:   ${keep.id} (created: ${keep.createdAt})`)
    duplicates.forEach((dup) => {
      console.log(`     ❌ DELETE: ${dup.id} (created: ${dup.createdAt})`)
    })
    console.log()

    toDelete.push(
      ...duplicates.map((dup) => ({
        ...dup,
        keepId: keep.id,
      })),
    )
  }

  return toDelete
}

async function deleteDuplicates(duplicates) {
  if (duplicates.length === 0) return

  if (!APPLY) {
    console.log(
      `\n🔒 DRY RUN: Would delete ${duplicates.length} duplicate record(s).`,
    )
    console.log('   Run with --apply to execute the cleanup.\n')
    return
  }

  console.log(`\n🗑️  Deleting ${duplicates.length} duplicate record(s)...\n`)

  const CHUNK_SIZE = 400
  for (let i = 0; i < duplicates.length; i += CHUNK_SIZE) {
    const chunk = duplicates.slice(i, i + CHUNK_SIZE)
    const batch = db.batch()

    for (const dup of chunk) {
      const studentRef = db.collection('students').doc(dup.id)

      // Soft-delete the student record
      batch.update(studentRef, {
        isDeleted: true,
        status: 'deleted',
        deletedReason: `Duplicate of ${dup.keepId}`,
        updatedAt: new Date().toISOString(),
      })

      console.log(`  ✅ Soft-deleted: ${dup.id} ("${dup.name}")`)
    }

    await batch.commit()
  }

  // Clean up parent childrenInfo arrays
  console.log('\n🔄 Cleaning up parent childrenInfo references...\n')
  const parentIds = [
    ...new Set(duplicates.map((d) => d.parentId).filter(Boolean)),
  ]

  for (const parentId of parentIds) {
    const parentRef = db.collection('parents').doc(parentId)
    const parentDoc = await parentRef.get()
    if (!parentDoc.exists) continue

    const deletedIds = new Set(
      duplicates.filter((d) => d.parentId === parentId).map((d) => d.id),
    )
    const currentChildren = parentDoc.data().childrenInfo || []
    const cleanedChildren = currentChildren.filter((c) => !deletedIds.has(c.id))

    if (cleanedChildren.length !== currentChildren.length) {
      await parentRef.update({ childrenInfo: cleanedChildren })
      console.log(
        `  ✅ Cleaned parent ${parentId}: removed ${currentChildren.length - cleanedChildren.length} stale reference(s)`,
      )
    }
  }

  console.log(
    `\n🎉 Cleanup complete! ${duplicates.length} duplicate(s) removed.\n`,
  )
}

async function main() {
  console.log('='.repeat(60))
  console.log('  Student Duplicate Cleanup Script')
  console.log(
    '  Mode:',
    APPLY ? '🟢 APPLY (changes will be written)' : '🔵 DRY RUN (preview only)',
  )
  console.log('='.repeat(60))

  try {
    const duplicates = await findDuplicateStudents()
    await deleteDuplicates(duplicates)
  } catch (err) {
    console.error('\n❌ Error during cleanup:', err.message)
    process.exit(1)
  }

  process.exit(0)
}

main()

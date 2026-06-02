/**
 * Firestore Data Integrity Audit & Cleanup
 *
 * Works with both production Firestore and Firebase Emulator.
 * Set FIRESTORE_EMULATOR_HOST env to point to the emulator.
 *
 * Checks:
 *  1. Soft-deleted records → HARD-DELETES them from Firestore
 *  2. Orphaned references: studentId/parentId/programId/classId pointing to non-existent docs
 *  3. Student status vs enrollments: students with active enrollments should be 'Active'
 *  4. Parent status vs children: parents with active children should be 'Active'
 *  5. Enrollment status/paymentStatus consistency
 *  6. Missing required fields and type errors (e.g. amount stored as string)
 *  7. Trial branchId presence
 *
 * Auto-fixes all fixable issues via batched writes.
 * Hard-deletes all soft-deleted documents so they disappear from the emulator.
 */

const { db, COLLECTIONS } = require('./src/config/database')

const ISSUES = []
const FIXES = []    // { ref, data } — field updates
const DELETES = []  // doc refs to hard-delete

function log(msg) { console.log(msg) }

function issue(collection, docId, description) {
  ISSUES.push({ collection, docId, description })
}

async function getAll(collectionName) {
  const snap = await db.collection(collectionName).get()
  return snap.docs.map(doc => ({ id: doc.id, ref: doc.ref, ...doc.data() }))
}

async function audit() {
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST
  log('=== Firestore Data Integrity Audit & Cleanup ===')
  log(`Target: ${emulatorHost ? `Emulator (${emulatorHost})` : 'Production Firestore'}\n`)

  // Load all collections
  log('Loading all collections...')
  const parents = await getAll(COLLECTIONS.PARENT || 'parents')
  const students = await getAll(COLLECTIONS.STUDENT || 'students')
  const programs = await getAll(COLLECTIONS.PROGRAM || 'programs')
  const classes = await getAll(COLLECTIONS.CLASS || 'classes')
  const enrollments = await getAll(COLLECTIONS.ENROLLMENT || 'enrollments')
  const trials = await getAll(COLLECTIONS.TRIAL || 'trials')
  const terms = await getAll(COLLECTIONS.TERM || 'terms')
  const branches = await getAll(COLLECTIONS.BRANCH || 'branches')
  
  // Also check payments and attendances
  let payments = []
  let attendances = []
  try { payments = await getAll(COLLECTIONS.PAYMENT || 'payments') } catch { /* optional */ }
  try { attendances = await getAll(COLLECTIONS.ATTENDANCE || 'attendances') } catch { /* optional */ }

  const parentIds = new Set(parents.filter(p => !p.isDeleted).map(p => p.id))
  const studentIds = new Set(students.filter(s => !s.isDeleted).map(s => s.id))
  const programIds = new Set(programs.filter(p => !p.isDeleted).map(p => p.id))
  const classIds = new Set(classes.filter(c => !c.isDeleted).map(c => c.id))

  log(`Loaded: ${parents.length} parents, ${students.length} students, ${programs.length} programs, ${classes.length} classes, ${enrollments.length} enrollments, ${trials.length} trials, ${terms.length} terms, ${branches.length} branches, ${payments.length} payments, ${attendances.length} attendances\n`)

  // ═══ 1. HARD-DELETE SOFT-DELETED RECORDS ═══
  log('--- 1. Purging soft-deleted records ---')

  const collections = [
    { name: 'parents', docs: parents },
    { name: 'students', docs: students },
    { name: 'enrollments', docs: enrollments },
    { name: 'trials', docs: trials },
    { name: 'programs', docs: programs },
    { name: 'classes', docs: classes },
    { name: 'payments', docs: payments },
  ]

  for (const { name, docs } of collections) {
    const deleted = docs.filter(d => d.isDeleted === true || String(d.status || '').toLowerCase() === 'deleted')
    if (deleted.length > 0) {
      for (const d of deleted) {
        issue(name, d.id, `Soft-deleted → will be HARD-DELETED`)
        DELETES.push(d.ref)
      }
    }
  }

  // Also check cancelled enrollments that are soft-deleted
  for (const e of enrollments) {
    if (e.isDeleted && !DELETES.includes(e.ref)) {
      issue('enrollments', e.id, `isDeleted=true, status="${e.status}" → will be HARD-DELETED`)
      DELETES.push(e.ref)
    }
  }

  // ═══ 2. ORPHANED REFERENCES ═══
  log('--- 2. Orphaned references ---')

  for (const s of students.filter(s => !s.isDeleted)) {
    if (s.parentId && !parentIds.has(s.parentId)) {
      issue('students', s.id, `parentId="${s.parentId}" does not exist`)
    }
  }

  for (const e of enrollments.filter(e => !e.isDeleted)) {
    if (e.studentId && !studentIds.has(e.studentId))
      issue('enrollments', e.id, `studentId="${e.studentId}" does not exist`)
    if (e.parentId && !parentIds.has(e.parentId))
      issue('enrollments', e.id, `parentId="${e.parentId}" does not exist`)
    if (e.programId && !programIds.has(e.programId))
      issue('enrollments', e.id, `programId="${e.programId}" does not exist`)
    if (e.classId && !classIds.has(e.classId))
      issue('enrollments', e.id, `classId="${e.classId}" does not exist`)
  }

  for (const t of trials.filter(t => !t.isDeleted)) {
    if (t.studentId && !studentIds.has(t.studentId))
      issue('trials', t.id, `studentId="${t.studentId}" does not exist`)
    if (t.programId && !programIds.has(t.programId))
      issue('trials', t.id, `programId="${t.programId}" does not exist`)
  }

  // ═══ 3. STUDENT STATUS vs ENROLLMENT STATUS ═══
  log('--- 3. Student status vs enrollments ---')

  const seatTakingStatuses = ['active', 'confirmed', 'paid', 'success', 'unpaid']
  for (const s of students.filter(s => !s.isDeleted)) {
    const activeEnrollments = enrollments.filter(
      e => !e.isDeleted && e.studentId === s.id &&
        seatTakingStatuses.includes(String(e.status || '').toLowerCase())
    )

    if (activeEnrollments.length > 0 && String(s.status || '').toLowerCase() === 'inactive') {
      issue('students', s.id, `Has ${activeEnrollments.length} active enrollment(s) but status="${s.status}" → fixing to "Active"`)
      FIXES.push({ ref: s.ref, data: { status: 'Active', updatedAt: new Date().toISOString() } })
    }
  }

  // ═══ 4. PARENT STATUS vs CHILDREN ═══
  log('--- 4. Parent status vs children ---')

  for (const p of parents.filter(p => !p.isDeleted)) {
    const children = students.filter(s => !s.isDeleted && s.parentId === p.id)
    const hasActiveChild = children.some(c => String(c.status || '').toLowerCase() === 'active')

    if (hasActiveChild && String(p.status || '').toLowerCase() === 'inactive') {
      issue('parents', p.id, `Has active children but status="${p.status}" → fixing to "Active"`)
      FIXES.push({ ref: p.ref, data: { status: 'Active', updatedAt: new Date().toISOString() } })
    }
  }

  // ═══ 5. ENROLLMENT paymentStatus vs status ═══
  log('--- 5. Enrollment status/paymentStatus consistency ---')

  for (const e of enrollments.filter(e => !e.isDeleted)) {
    const status = String(e.status || '').toLowerCase()
    const paymentStatus = String(e.paymentStatus || '').toLowerCase()

    if (status === 'paid' && paymentStatus === 'unpaid') {
      issue('enrollments', e.id, `status="paid" but paymentStatus="unpaid" → fixing paymentStatus`)
      FIXES.push({ ref: e.ref, data: { paymentStatus: 'paid' } })
    }
    if (paymentStatus === 'paid' && status === 'unpaid') {
      issue('enrollments', e.id, `paymentStatus="paid" but status="unpaid" → fixing status`)
      FIXES.push({ ref: e.ref, data: { status: 'paid' } })
    }
  }

  // ═══ 6. MISSING FIELDS & TYPE ERRORS ═══
  log('--- 6. Missing fields & type errors ---')

  for (const e of enrollments.filter(e => !e.isDeleted)) {
    if (!e.studentId) issue('enrollments', e.id, 'Missing studentId')
    if (!e.classId) issue('enrollments', e.id, 'Missing classId')
    if (!e.programId) issue('enrollments', e.id, 'Missing programId')
    if (e.amount === undefined || e.amount === null) {
      issue('enrollments', e.id, 'Missing amount → defaulting to 0')
      FIXES.push({ ref: e.ref, data: { amount: 0 } })
    }
    if (typeof e.amount === 'string') {
      issue('enrollments', e.id, `amount="${e.amount}" is string → casting to number`)
      FIXES.push({ ref: e.ref, data: { amount: Number(e.amount) || 0 } })
    }
  }

  // ═══ 7. TRIAL BRANCH PRESENCE ═══
  log('--- 7. Trial branch association ---')

  for (const t of trials.filter(t => !t.isDeleted)) {
    if (!t.studentId) issue('trials', t.id, 'Missing studentId')
    if (!t.programId) issue('trials', t.id, 'Missing programId')
    if (!t.branchId && !t.branch?.id) {
      issue('trials', t.id, 'No branch association (branchId or branch.id missing)')
    }
  }

  // ═══ REPORT ═══
  log('\n════════════════════════════════════════')
  log(`  AUDIT COMPLETE: ${ISSUES.length} issue(s) found`)
  log(`  🗑️  ${DELETES.length} document(s) to hard-delete`)
  log(`  🔧 ${FIXES.length} field fix(es) to apply`)
  log('════════════════════════════════════════\n')

  if (ISSUES.length === 0) {
    log('✅ All data looks clean!')
    return
  }

  // Group by collection for readable output
  const grouped = {}
  ISSUES.forEach(i => {
    if (!grouped[i.collection]) grouped[i.collection] = []
    grouped[i.collection].push(i)
  })

  for (const [coll, items] of Object.entries(grouped)) {
    log(`\n📦 ${coll.toUpperCase()} (${items.length} issue${items.length > 1 ? 's' : ''}):`)
    items.forEach(i => log(`  ❌ [${i.docId}] ${i.description}`))
  }

  // ═══ APPLY HARD DELETES ═══
  if (DELETES.length > 0) {
    log(`\n🗑️  Hard-deleting ${DELETES.length} soft-deleted document(s)...`)
    const CHUNK = 400
    for (let i = 0; i < DELETES.length; i += CHUNK) {
      const batch = db.batch()
      DELETES.slice(i, i + CHUNK).forEach(ref => batch.delete(ref))
      await batch.commit()
    }
    log(`✅ Deleted ${DELETES.length} document(s) from Firestore.`)
  }

  // ═══ APPLY FIELD FIXES ═══
  if (FIXES.length > 0) {
    log(`\n🔧 Applying ${FIXES.length} field fix(es)...`)
    const CHUNK = 400
    for (let i = 0; i < FIXES.length; i += CHUNK) {
      const batch = db.batch()
      FIXES.slice(i, i + CHUNK).forEach(f => batch.update(f.ref, f.data))
      await batch.commit()
    }
    log(`✅ Applied ${FIXES.length} fix(es) successfully.`)
  }
}

audit().then(() => {
  log('\nDone.')
  process.exit(0)
}).catch(err => {
  console.error('Audit failed:', err)
  process.exit(1)
})

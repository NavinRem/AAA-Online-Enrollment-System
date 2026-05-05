const { db, COLLECTIONS } = require('../config/database')
const { validateBranch } = require('../validators/branchValidator')
const { validateCategory } = require('../validators/categoryValidator')
const { validateLevel } = require('../validators/levelValidator')
const { validateTerm } = require('../validators/termValidator')
const { validateProgram } = require('../validators/programValidator')
const { validateTeacher } = require('../validators/teacherValidator')
const { validateParent } = require('../validators/parentValidator')
const { validateStudent } = require('../validators/studentValidator')
const { validateClass } = require('../validators/classValidator')
const { validateEnrollment } = require('../validators/enrollmentValidator')
const { validateAdmin } = require('../validators/adminValidator')
const { validatePayment } = require('../validators/paymentValidator')
const { validateTrial } = require('../validators/trialValidator')
const profileHelper = require('../utils/profileHelper')

/**
 * Clear a collection entirely (Safe for Emulator)
 * Performs a Deep Wipe of sub-collections and handles >500 docs.
 */
async function clearCollection(collectionName) {
  let snapshot = await db.collection(collectionName).get()
  
  while (!snapshot.empty) {
    const batch = db.batch()
    snapshot.docs.forEach((doc) => batch.delete(doc.ref))
    await batch.commit()
    // Re-fetch to handle pagination if > 500
    snapshot = await db.collection(collectionName).limit(500).get()
  }
  
  console.log(`🗑️ Cleared collection: ${collectionName}`)
}

/**
 * Total Liquidation: Removes all sub-collections via Collection Group
 */
async function clearAllSubCollections() {
  console.log('🧹 Sweeping Orphaned Sub-collections...')
  const groups = [COLLECTIONS.SCHEDULE]
  for (const group of groups) {
    let snapshot = await db.collectionGroup(group).get()
    while (!snapshot.empty) {
      const batch = db.batch()
      snapshot.docs.forEach((doc) => batch.delete(doc.ref))
      await batch.commit()
      snapshot = await db.collectionGroup(group).limit(500).get()
    }
  }
}

async function seedData() {
  const args = process.argv.slice(2)
  const shouldClear = args.includes('--clear')

  console.log('🚀 Starting ULTIMATE CASCADING SEEDING...')

  try {
    if (shouldClear) {
      console.log('--- Global Purge: Wiping ALL Collections ---')
      
      // 1. Clear Orphaned Sub-collections FIRST
      await clearAllSubCollections()

      // 2. Clear Top-level Collections
      const allCollections = Object.values(COLLECTIONS)
      for (const coll of allCollections) {
        await clearCollection(coll)
      }
    }

    // 0. Admins
    console.log('\nStep 0: Admins')
    const adminData = {
      name: 'Super Admin',
      email: 'admin@academy.com',
      status: 'active',
      profileURL:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2080',
    }
    await db.collection(COLLECTIONS.ADMIN).add(validateAdmin(adminData))

    // 1. Categories & Levels
    console.log('Step 1: Multimedia Categories')
    const categories = [
      { name: 'Visual Arts' },
      { name: 'Game & Code' },
      { name: 'Digital Music' },
    ]
    const levels = [{ name: 'Foundation' }, { name: 'Mastery' }]

    const catMap = {}
    for (const c of categories) {
      const ref = await db
        .collection(COLLECTIONS.CATEGORY)
        .add(validateCategory(c))
      catMap[c.name] = ref.id
    }

    const lvlMap = {}
    for (const l of levels) {
      const ref = await db.collection(COLLECTIONS.LEVEL).add(validateLevel(l))
      lvlMap[l.name] = ref.id
    }

    // 2. Branch
    console.log('Step 2: Operations Branch')
    const branchSpec = {
      name: 'Academy Innovation Center',
      abbr: 'AIC',
      location: '77 Silicon Way',
      phone: '010101010',
    }
    const bRef = await db
      .collection(COLLECTIONS.BRANCH)
      .add(validateBranch(branchSpec))
    const branchSnapshot = profileHelper.getBranchSnapshot(bRef.id, branchSpec)

    // 3. Teachers
    console.log('Step 3: Industry Mentors')
    const teacherData = {
      name: 'Sarah Spark',
      profileURL:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1974',
    }
    const tRef = await db
      .collection(COLLECTIONS.TEACHER)
      .add(validateTeacher(teacherData))
    const teacherSnapshot = profileHelper.getTeacherSnapshot(
      tRef.id,
      teacherData,
    )

    // 4. Programs (Professional Suite)
    console.log('Step 4: Academic Programs')
    const programs = [
      {
        name: 'Cinematic Concept Art',
        categoryId: catMap['Visual Arts'],
        levelId: lvlMap['Mastery'],
        totalSessions: 32,
        basePrice: 450,
        category: 'Visual Arts',
        level: 'Mastery',
        profileURL:
          'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=2071',
      },
      {
        name: 'Game Development with Unity',
        categoryId: catMap['Game & Code'],
        levelId: lvlMap['Foundation'],
        totalSessions: 24,
        basePrice: 380,
        category: 'Game & Code',
        level: 'Foundation',
        profileURL:
          'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070',
      },
    ]

    const progSnapshots = []
    const progRefs = []

    for (const p of programs) {
      const validated = validateProgram(p)
      const ref = await db.collection(COLLECTIONS.PROGRAM).add(validated)
      progRefs.push(ref)
      progSnapshots.push(profileHelper.getProgramSnapshot(ref.id, validated))
    }

    // 5. Term
    console.log('Step 5: Academic Term')
    const termSpec = {
      name: 'Winter Quarter 2026',
      startDate: '2026-01-05',
      endDate: '2026-03-25',
      status: 'active',
    }
    const termRef = await db
      .collection(COLLECTIONS.TERM)
      .add(validateTerm(termSpec))
    const termSnapshot = profileHelper.getTermSnapshot(termRef.id, termSpec)

    // 6. Classes (The Operational Units)
    console.log('Step 6: Specialized Classes')
    const classRefs = []
    const classSnapshots = []

    for (let i = 0; i < progSnapshots.length; i++) {
      const progSnap = progSnapshots[i]
      const classDataSpec = {
        programId: progSnap.id,
        termId: termRef.id,
        branchId: bRef.id,
        teacherId: tRef.id,
        schedules: [{ day: i === 0 ? 'Tuesday' : 'Thursday', timeslot: '18:00 - 20:30' }],
        maxCapacity: 12,
        enrolledCount: 0,
      }
      const validatedClassBase = validateClass(classDataSpec)
      const finalClassData = {
        ...validatedClassBase,
        program: progSnap,
        term: termSnapshot,
        branch: branchSnapshot,
        teacher: teacherSnapshot,
      }
      const cRef = await db.collection(COLLECTIONS.CLASS).add(finalClassData)
      classRefs.push(cRef)
      classSnapshots.push(profileHelper.getClassSnapshot(cRef.id, finalClassData))
    }

    // 7. Enrollment Chain
    console.log('Step 7: Enrollment Chain')
    const parentData = {
      name: 'Alice Parent',
      email: 'alice@example.com',
      phone: '099111222',
      status: 'active',
    }
    const pRef = await db
      .collection(COLLECTIONS.PARENT)
      .add(validateParent(parentData))
    const parentSnapshot = profileHelper.getParentSnapshot(pRef.id, parentData)

    const studentData = {
      parentId: pRef.id,
      name: 'Leo Junior',
      dob: '2012-08-15',
      status: 'active',
    }
    const sRef = await db
      .collection(COLLECTIONS.STUDENT)
      .add(validateStudent(studentData))
    const studentSnapshot = profileHelper.getStudentSnapshot(
      sRef.id,
      studentData,
    )

    // Enroll Leo in ALL classes to verify deep cascading
    for (let i = 0; i < classRefs.length; i++) {
        const enrollmentData = {
          parentId: pRef.id,
          studentId: sRef.id,
          classId: classRefs[i].id,
          branchId: bRef.id,
          enrolledSessions: 32,
          amount: 450,
          status: 'confirmed',
          paymentStatus: 'paid',
          enrollmentType: 'New',
          parent: parentSnapshot,
          student: studentSnapshot,
          class: classSnapshots[i],
          enrollAt: new Date().toISOString(),
        }
        const validatedEnroll = validateEnrollment(enrollmentData)
        const finalEnroll = {
          ...validatedEnroll,
          parent: parentSnapshot,
          student: studentSnapshot,
          class: classSnapshots[i],
        }
        const eRef = await db.collection(COLLECTIONS.ENROLLMENT).add(finalEnroll)
        await db
          .collection(COLLECTIONS.CLASS)
          .doc(classRefs[i].id)
          .update({ enrolledCount: 1 })

        // 8. Payment (Linked to Enrollment)
        console.log(`Step 8: Payment for Enrollment ${eRef.id}`)
        const paymentData = {
          enrollmentId: eRef.id,
          parentId: pRef.id,
          amount: enrollmentData.amount,
          method: 'bank_transfer',
          status: 'paid',
          paidAt: new Date().toISOString(),
          transactionId: `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        }
        await db.collection(COLLECTIONS.PAYMENT).add(validatePayment(paymentData))
    }

    // 9. Trial Request
    console.log('Step 9: Trial Request')
    const trialData = {
      studentId: sRef.id,
      parentId: pRef.id,
      classId: classRefs[0].id,
      trialDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      status: 'confirmed',
      remark: 'First time trial for cinematic arts',
    }
    await db.collection(COLLECTIONS.TRIAL).add(validateTrial(trialData))

    console.log('\n✨ CASCADING PURE STATE ACHIEVED!')
    console.log(
      'Logical Integrity: Category -> Program (String) -> Class (Snapshot) -> Enrollment (Snapshot).',
    )
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Seeding Failed:', error.message)
    process.exit(1)
  }
}

seedData()

const { db, COLLECTIONS } = require('../config/database');
const branchService = require('../services/branchService');
const categoryService = require('../services/categoryService');
const levelService = require('../services/levelService');
const termService = require('../services/termService');
const programService = require('../services/programService');
const classService = require('../services/classService');
const userService = require('../services/userService');
const studentService = require('../services/studentService');
const enrollmentService = require('../services/enrollmentService');

/**
 * seedAcademic.js
 * 
 * Recreates core academic data with the correct schema and snapshots.
 * RUN WITH:
 * node src/scripts/seedAcademic.js
 */

async function seed() {
  console.log('🚀 Starting Academic Data Seeding...');

  try {
    // 1. Wipe targeted collections
    const collectionsToWipe = [
      COLLECTIONS.BRANCH,
      COLLECTIONS.CATEGORY,
      COLLECTIONS.TERM,
      COLLECTIONS.PROGRAM,
      COLLECTIONS.CLASS,
      COLLECTIONS.ENROLLMENT,
      COLLECTIONS.STUDENT,
      COLLECTIONS.PARENT
    ];

    for (const collName of collectionsToWipe) {
      console.log(`🗑️  Wiping ${collName}...`);
      const snapshot = await db.collection(collName).get();
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    // 2. Create Branch
    console.log('🏢 Creating Branches...');
    const branchFM = await branchService.createBranch({
      abbr: 'FM',
      name: 'Funmall Studio',
      location: 'Phnom Penh, Cambodia'
    });
    const branchHQ = await branchService.createBranch({
      abbr: 'HQ',
      name: 'Headquarters',
      location: 'Central Tower, PP'
    });

    // 3. Create Category & Levels
    console.log('📂 Creating Categories...');
    const catDance = await categoryService.createCategory({ name: 'Classical Dance' });
    const lvl1 = await levelService.createLevel(catDance.id, { name: 'Level 1', order: 1 });
    const lvl2 = await levelService.createLevel(catDance.id, { name: 'Level 2', order: 2 });

    // 4. Create Term
    console.log('📅 Creating Terms...');
    const term2026 = await termService.createTerm({
      name: 'Term 1 2026',
      startDate: '2026-01-01T00:00:00Z',
      endDate: '2026-06-30T23:59:59Z'
    });

    // 5. Create Program
    console.log('📋 Creating Programs...');
    const progBallet = await programService.createProgram({
      name: 'Ballet Fundamentals',
      categoryId: catDance.id,
      levelId: lvl1.id,
      sessionNumber: 24,
      weeksNumber: 12,
      basePrice: 280,
      maxCapacity: 15,
      type: 'group'
    });

    // 6. Create Classes (Operatonal instances)
    console.log('🏫 Creating Classes...');
    const classMon = await classService.createClass({
      programId: progBallet.id,
      termId: term2026.id,
      branchId: branchFM.id,
      day: 'Monday',
      timeslot: '16:00 - 17:30',
      status: 'open'
    });

    const classSat = await classService.createClass({
      programId: progBallet.id,
      termId: term2026.id,
      branchId: branchHQ.id,
      day: 'Saturday',
      timeslot: '09:00 - 10:30',
      status: 'open'
    });

    // 7. Create Demo Parent & Student
    console.log('👤 Creating Demo Users...');
    // Create Parent via registration (mocking auth)
    const parentId = 'demo_parent_001';
    await db.collection(COLLECTIONS.PARENT).doc(parentId).set({
      uid: parentId,
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '012345678',
      role: 'parent',
      status: 'Active',
      createdAt: new Date().toISOString()
    });

    const studentResult = await studentService.createStudent({
      parentId: parentId,
      name: 'Little Doe',
      dob: '2018-05-20',
      medicalNote: 'None'
    });
    const studentId = studentResult.id;

    // 8. Create Demo Enrollment
    console.log('📝 Creating Demo Enrollment...');
    await enrollmentService.createEnrollment({
      studentId: studentId,
      programId: progBallet.id,
      classId: classMon.id,
      enrollmentType: 'Full',
      isProrated: false,
      amount: 280
    });

    console.log('✅ Seeding Complete! System is now clean and structured.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();

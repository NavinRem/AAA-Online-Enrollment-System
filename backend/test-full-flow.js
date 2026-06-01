const { db } = require('./src/config/database');
const trialService = require('./src/services/trialService');
const enrollmentService = require('./src/services/enrollmentService');
const attendanceService = require('./src/services/attendanceService');
const parentService = require('./src/services/parentService');

async function runE2ETest() {
  console.log('=== STARTING E2E TEST: Trial -> Enrollment -> Attendance ===\n');

  try {
    console.log('1. Gathering test data from database...');
    
    // Get a valid term
    const termsSnap = await db.collection('terms').limit(1).get();
    if (termsSnap.empty) throw new Error('No term found.');
    const term = termsSnap.docs[0].data();
    term.id = termsSnap.docs[0].id;
    
    if (!term.offerings || term.offerings.length === 0) {
      throw new Error('Term has no offerings.');
    }
    const offering = term.offerings[0];

    // Get a valid parent (not deleted)
    const parentsSnap = await db.collection('parents').where('isDeleted', '==', false).limit(1).get();
    if (parentsSnap.empty) throw new Error('No parents found.');
    const parentId = parentsSnap.docs[0].id;
    const parentData = await parentService.getParent(parentId);
    
    if (!parentData.childrenInfo || parentData.childrenInfo.length === 0) {
      throw new Error('Parent has no children.');
    }
    const student = parentData.childrenInfo[0];
    
    console.log(`- Term: ${term.name} (${term.id})`);
    console.log(`- Class: ${offering.classId}`);
    console.log(`- Student: ${student.name} (${student.id})\n`);

    // 2. Create Trial
    console.log('2. Testing Trial Creation...');
    const trialData = {
      isGuest: false,
      parentId: parentId,
      studentId: student.id,
      programId: offering.program?.id || 'prog1',
      classId: offering.classId,
      branchId: offering.branchId || 'default',
      trialDate: '2026-06-01',
      status: 'scheduled',
    };
    
    const trialResult = await trialService.createTrial(trialData);
    console.log(`✅ Trial created successfully! ID: ${trialResult.id}`);
    
    // 3. Create Enrollment
    console.log('\n3. Testing Enrollment Creation...');
    const enrollmentData = {
      parentId: parentId,
      studentId: student.id,
      programId: offering.program?.id || 'prog1',
      classId: offering.classId,
      termId: term.id,
      termOfferingId: offering.id || offering.offeringId || 'off1',
      enrollAt: '2026-06-01',
      status: 'paid',
      paymentStatus: 'paid',
      amount: 100
    };
    
    const enrollmentResult = await enrollmentService.createEnrollment(enrollmentData);
    console.log(`✅ Enrollment created successfully! ID: ${enrollmentResult.id}`);

    // 4. Record Attendance
    console.log('\n4. Testing Attendance Recording...');
    const sessionId = 'session-1';
    const statuses = { [student.id]: 'P' };
    const attendanceResult = await attendanceService.recordAttendance(offering.classId, sessionId, statuses, term.id);
    console.log(`✅ Attendance recorded successfully! Wrote ${attendanceResult.length} documents.`);

    // 5. Verification (Read from Firebase)
    console.log('\n=== FIREBASE DATA VERIFICATION ===');
    
    const trialDoc = await db.collection('trials').doc(trialResult.id).get();
    console.log('\n--- Trial Document ---');
    console.log(JSON.stringify(trialDoc.data(), null, 2));

    const enrollmentDoc = await db.collection('enrollments').doc(enrollmentResult.id).get();
    console.log('\n--- Enrollment Document ---');
    console.log(JSON.stringify(enrollmentDoc.data(), null, 2));

    const attendanceDocs = await db.collection('attendances').where('studentId', '==', student.id).where('sessionId', '==', 'session-1').get();
    console.log('\n--- Attendance Document ---');
    attendanceDocs.forEach(doc => {
      console.log(`ID: ${doc.id}`);
      console.log(JSON.stringify(doc.data(), null, 2));
    });

  } catch (err) {
    console.error('❌ Test Failed:', err);
  } finally {
    process.exit(0);
  }
}

runE2ETest();

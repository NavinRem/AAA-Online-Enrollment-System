const { db } = require('./src/config/database');
const attendanceService = require('./src/services/attendanceService');

async function testAttendanceAPI() {
  console.log('--- Starting Attendance Logic Integration Test ---');

  // 1. Setup: Find a paid enrollment to test with
  console.log('\n1. Finding a valid paid enrollment in the database...');
  const enrollmentsSnap = await db.collection('enrollments')
    .where('status', '==', 'paid')
    .limit(1)
    .get();

  if (enrollmentsSnap.empty) {
    console.log('No paid enrollments found. Cannot run test.');
    process.exit(1);
  }

  const enrollment = enrollmentsSnap.docs[0].data();
  const classId = enrollment.classId;
  const termId = enrollment.termId;
  const studentId = enrollment.studentId;
  const sessionId = 'session-1';

  console.log(`Found paid enrollment!`);
  console.log(`- Class ID: ${classId}`);
  console.log(`- Term ID: ${termId}`);
  console.log(`- Student ID: ${studentId}`);

  // 2. Test attendanceService.recordAttendance
  console.log('\n2. Testing attendanceService.recordAttendance...');
  
  const statuses = {
    [studentId]: 'P' // Mark present
  };

  try {
    const resultList = await attendanceService.recordAttendance(classId, sessionId, statuses, termId);
    console.log(`Successfully recorded attendance. Result:`, resultList);
  } catch (err) {
    console.error('Error during recordAttendance:', err);
    process.exit(1);
  }

  // 3. Test attendanceService.getClassAttendance
  console.log('\n3. Testing attendanceService.getClassAttendance...');
  try {
    const classAttendanceMap = await attendanceService.getClassAttendance(classId);
    
    console.log('Reconstructed Class Attendance Map:', JSON.stringify(classAttendanceMap, null, 2));

    // Verify mapping
    const sessionData = classAttendanceMap[sessionId];
    if (sessionData && sessionData[studentId] === 'P') {
      console.log('\n✅ SUCCESS: The backend successfully saved individual documents and rebuilt the expected map structure for the frontend!');
    } else {
      console.error('\n❌ ERROR: The returned mapping does not match expected output.');
      process.exit(1);
    }

  } catch (err) {
    console.error('Error during getClassAttendance:', err);
    process.exit(1);
  }

  process.exit(0);
}

testAttendanceAPI();

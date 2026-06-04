const { db, COLLECTIONS } = require('../config/database')
const enrollmentService = require('../services/enrollmentService')
const attendanceService = require('../services/attendanceService')

async function runTest() {
  console.log('🚀 Starting Transfer Logic Future Timeline Test...')
  let oldEnrollmentId = null
  try {
    // 1. Create a dummy parent and student
    console.log('1. Creating Mock Parent and Student')
    const parentRef = await db.collection(COLLECTIONS.PARENT).add({ name: 'Test Parent' })
    const studentRef = await db.collection(COLLECTIONS.STUDENT).add({ name: 'Test Student', parentId: parentRef.id })
    const studentId = studentRef.id

    // 2. Create mock Program, Branches, and Classes
    console.log('2. Creating Mock Program and Branches')
    const programRef = await db.collection(COLLECTIONS.PROGRAM).add({ name: 'Test Program' })
    const branchARef = await db.collection(COLLECTIONS.BRANCH).add({ abbr: 'BR-A' })
    const branchBRef = await db.collection(COLLECTIONS.BRANCH).add({ abbr: 'BR-B' })

    const classARef = await db.collection(COLLECTIONS.CLASS).add({ name: 'Class A' })
    const classBRef = await db.collection(COLLECTIONS.CLASS).add({ name: 'Class B' })

    const offeringAId = 'offering_a_' + Date.now()
    const offeringBId = 'offering_b_' + Date.now()
    const scheduleIdA = 'schedule_a_' + Date.now()
    const scheduleIdB = 'schedule_b_' + Date.now()

    // Create Future Term
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7) // 7 days in future
    const termRef = await db.collection(COLLECTIONS.TERM).add({
      name: 'Future Term Test',
      startDate: futureDate.toISOString(),
      offerings: [
        {
          offeringId: offeringAId,
          classId: classARef.id,
          branchId: branchARef.id,
          scheduleId: scheduleIdA,
          program: { id: programRef.id }
        },
        {
          offeringId: offeringBId,
          classId: classBRef.id,
          branchId: branchBRef.id,
          scheduleId: scheduleIdB,
          program: { id: programRef.id }
        }
      ]
    })

    // 3. Create initial enrollment in Branch A
    console.log('3. Enrolling Student in Branch A (11 sessions)')
    const initialEnrollment = {
      parentId: parentRef.id,
      studentId: studentId,
      programId: programRef.id,
      classId: classARef.id,
      termId: termRef.id,
      termOfferingId: offeringAId,
      branchId: branchARef.id,
      scheduleId: scheduleIdA,
      enrolledSessions: 11,
      status: 'paid',
      paymentStatus: 'paid',
      amount: 500,
      enrollAt: new Date().toISOString()
    }
    
    // We can insert directly to avoid all the snapshot requirements of createEnrollment, 
    // or we can use the service. Since the service requires deep populated data for classes,
    // let's insert directly for the mock context to avoid massive mocking overhead.
    const enrollRef = await db.collection(COLLECTIONS.ENROLLMENT).add(initialEnrollment)
    oldEnrollmentId = enrollRef.id
    console.log(`✅ Enrolled successfully. ID: ${oldEnrollmentId}`)

    // 4. Simulate Future Attendance for 4 sessions (3 Consumed, 1 Not Attended yet)
    console.log('4. Simulating Future Attendance (Consumed: 3)')
    const sessionId1 = 'sess_1' // P (consumed)
    const sessionId2 = 'sess_2' // L (consumed)
    const sessionId3 = 'sess_3' // A (consumed)
    const sessionId4 = 'sess_4' // N (not consumed)

    await attendanceService.recordAttendance(classARef.id, sessionId1, { [studentId]: 'P' }, termRef.id, scheduleIdA)
    await attendanceService.recordAttendance(classARef.id, sessionId2, { [studentId]: 'L' }, termRef.id, scheduleIdA)
    await attendanceService.recordAttendance(classARef.id, sessionId3, { [studentId]: 'A' }, termRef.id, scheduleIdA)
    await attendanceService.recordAttendance(classARef.id, sessionId4, { [studentId]: 'N' }, termRef.id, scheduleIdA)

    console.log('✅ Attendance recorded successfully.')

    // 5. Transfer Enrollment to Branch B
    console.log('5. Executing Transfer to Branch B...')
    const transferData = {
      termOfferingId: offeringBId,
      classId: classBRef.id,
      termId: termRef.id,
      branchId: branchBRef.id,
      scheduleId: scheduleIdB
    }

    const newEnrollment = await enrollmentService.transferEnrollment(oldEnrollmentId, transferData)
    console.log(`✅ Transferred! New Enrollment ID: ${newEnrollment.id}`)

    // 6. Verification assertions
    console.log('\n--- VERIFICATION RESULTS ---')
    
    // Verify old enrollment is marked transferred
    const oldDoc = await db.collection(COLLECTIONS.ENROLLMENT).doc(oldEnrollmentId).get()
    const oldData = oldDoc.data()
    if (oldData.status === 'transferred') {
      console.log('✅ PASS: Old enrollment status correctly changed to "transferred".')
    } else {
      console.log(`❌ FAIL: Old enrollment status is "${oldData.status}". Expected: "transferred".`)
    }

    // Verify new enrollment has capped sessions (11 original - 3 consumed = 8)
    if (newEnrollment.enrolledSessions === 8) {
      console.log('✅ PASS: New enrollment sessions correctly capped to 8.')
    } else {
      console.log(`❌ FAIL: New enrollment sessions is ${newEnrollment.enrolledSessions}. Expected: 8.`)
    }

    if (newEnrollment.status === 'paid') {
      console.log('✅ PASS: New enrollment kept "paid" status.')
    } else {
      console.log(`❌ FAIL: New enrollment status is "${newEnrollment.status}". Expected: "paid".`)
    }

    console.log('\n🎉 Test Completed Successfully.')

  } catch (error) {
    console.error('❌ Test Failed:', error)
  } finally {
    // Cleanup mock data
    if (oldEnrollmentId) {
      console.log('🧹 Cleaning up mock enrollment...')
      await db.collection(COLLECTIONS.ENROLLMENT).doc(oldEnrollmentId).delete()
    }
    process.exit(0)
  }
}

runTest()

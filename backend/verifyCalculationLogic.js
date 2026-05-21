const { db, COLLECTIONS } = require('./src/config/database')
const termService = require('./src/services/termService')
const enrollmentService = require('./src/services/enrollmentService')

async function runTests() {
  console.log(
    '🚀 STARTING AUTOMATED BACKEND DATA INTEGRITY & CALCULATION TESTS 🚀\n',
  )
  let passCount = 0
  let failCount = 0

  const testTermId = 'test-term-calc-' + Date.now()
  const testBranchId = 'test-branch-calc-' + Date.now()
  const testProgramAId = 'test-prog-a-' + Date.now()
  const testProgramBId = 'test-prog-b-' + Date.now()
  const testClassId = 'test-class-calc-' + Date.now()
  const testStudent1Id = 'test-student-1-' + Date.now()
  const testStudent2Id = 'test-student-2-' + Date.now()
  const testStudent3Id = 'test-student-3-' + Date.now()
  const testEnrollment1Id = 'test-enroll-1-' + Date.now()
  const testEnrollment2Id = 'test-enroll-2-' + Date.now()
  const testEnrollment3Id = 'test-enroll-3-' + Date.now()

  try {
    // 1. Setup Mock Docs
    console.log('📦 Setting up mock documents...')

    // Create Branch
    await db.collection(COLLECTIONS.BRANCH).doc(testBranchId).set({
      name: 'Test Branch',
      code: 'TB',
    })

    // Create Programs
    await db.collection(COLLECTIONS.PROGRAM).doc(testProgramAId).set({
      name: 'Test Program A',
      totalEnrolledCount: 1, // Start with 1 seat-taking enrollment
    })
    await db.collection(COLLECTIONS.PROGRAM).doc(testProgramBId).set({
      name: 'Test Program B',
      totalEnrolledCount: 0,
    })

    // Create Term
    await db
      .collection(COLLECTIONS.TERM)
      .doc(testTermId)
      .set({
        name: 'Test Term',
        startDate: '2026-06-01T00:00:00.000Z',
        endDate: '2026-08-31T23:59:59.000Z',
        status: 'active',
        branchIds: [testBranchId],
        offerings: [
          {
            offeringId: testClassId,
            classId: testClassId,
            programId: testProgramAId,
            branchId: testBranchId,
            program: { id: testProgramAId, name: 'Test Program A' },
            branch: { id: testBranchId, name: 'Test Branch' },
            schedule: { days: ['Saturday'], time: '09:00 AM' },
          },
        ],
      })

    // Create Class
    await db.collection(COLLECTIONS.CLASS).doc(testClassId).set({
      programId: testProgramAId,
      branchId: testBranchId,
      termId: testTermId,
    })

    // Create Students
    await db
      .collection(COLLECTIONS.STUDENT)
      .doc(testStudent1Id)
      .set({ name: 'Active Paid Student', parentId: 'parent-1' })
    await db
      .collection(COLLECTIONS.STUDENT)
      .doc(testStudent2Id)
      .set({ name: 'Active Unpaid Student', parentId: 'parent-1' })
    await db
      .collection(COLLECTIONS.STUDENT)
      .doc(testStudent3Id)
      .set({ name: 'Cancelled Student', parentId: 'parent-1' })

    // Create Enrollments
    // Enrollment 1: Active, Paid -> Should be in getTerm offerings and counted in revenue
    await db.collection(COLLECTIONS.ENROLLMENT).doc(testEnrollment1Id).set({
      studentId: testStudent1Id,
      termId: testTermId,
      branchId: testBranchId,
      classId: testClassId,
      programId: testProgramAId,
      amount: 150,
      status: 'paid',
      paymentStatus: 'paid',
      isDeleted: false,
      enrollAt: new Date().toISOString(),
    })

    // Enrollment 2: Active, Unpaid -> Should be in getTerm offerings but NOT in revenue
    await db.collection(COLLECTIONS.ENROLLMENT).doc(testEnrollment2Id).set({
      studentId: testStudent2Id,
      termId: testTermId,
      branchId: testBranchId,
      classId: testClassId,
      programId: testProgramAId,
      amount: 200,
      status: 'unpaid',
      paymentStatus: 'unpaid',
      isDeleted: false,
      enrollAt: new Date().toISOString(),
    })

    // Enrollment 3: Cancelled, Paid -> Should NOT be in getTerm offerings and NOT in revenue
    await db.collection(COLLECTIONS.ENROLLMENT).doc(testEnrollment3Id).set({
      studentId: testStudent3Id,
      termId: testTermId,
      branchId: testBranchId,
      classId: testClassId,
      programId: testProgramAId,
      amount: 250,
      status: 'cancelled',
      paymentStatus: 'paid',
      isDeleted: false,
      enrollAt: new Date().toISOString(),
    })

    console.log('✅ Mock data populated successfully!\n')

    // ----------------------------------------------------
    // TEST 1: Offerings Enrollment Statuses (getTerm)
    // ----------------------------------------------------
    console.log(
      '🧪 Running Test 1: getTerm includes paid and unpaid active students...',
    )
    const termResult = await termService.getTerm(testTermId)

    // Check offerings student count. It should be 2 (Enrollment 1 and Enrollment 2; Enrollment 3 is cancelled)
    const offeringClass = termResult.offerings.find(
      (o) => String(o.classId) === String(testClassId),
    )
    const offeringStudentIds = offeringClass
      ? offeringClass.studentIds || []
      : []

    const hasStudent1 = offeringStudentIds.includes(testStudent1Id)
    const hasStudent2 = offeringStudentIds.includes(testStudent2Id)
    const hasStudent3 = offeringStudentIds.includes(testStudent3Id)

    if (
      hasStudent1 &&
      hasStudent2 &&
      !hasStudent3 &&
      offeringStudentIds.length === 2
    ) {
      console.log(
        '✅ Test 1 Passed! Active paid and unpaid students are mapped, cancelled is excluded.',
      )
      passCount++
    } else {
      console.error('❌ Test 1 Failed! Offering studentIds list mismatch. Got:')
      console.error(offeringStudentIds)
      failCount++
    }
    console.log('')

    // ----------------------------------------------------
    // TEST 2: Backend Term Revenue Aggregation (getAllTerms)
    // ----------------------------------------------------
    console.log(
      '🧪 Running Test 2: getAllTerms aggregates only successful paid revenue...',
    )
    const allTerms = await termService.getAllTerms()
    const targetTermStats = allTerms.find((t) => t.id === testTermId)

    if (targetTermStats && targetTermStats.revenue === 150) {
      console.log(
        '✅ Test 2 Passed! Revenue for the term aggregates to exactly $150 (unpaid and cancelled excluded).',
      )
      passCount++
    } else {
      console.error(
        `❌ Test 2 Failed! Expected term revenue to be 150, but got ${targetTermStats ? targetTermStats.revenue : 'N/A'}`,
      )
      failCount++
    }
    console.log('')

    // ----------------------------------------------------
    // TEST 3: Program Switching Capacity Drift (updateEnrollment)
    // ----------------------------------------------------
    console.log(
      '🧪 Running Test 3: Changing enrollment program updates capacity counters transactionally...',
    )

    // Switch Enrollment 1 from Program A to Program B
    await enrollmentService.updateEnrollment(testEnrollment1Id, {
      programId: testProgramBId,
    })

    // Check Program doc counts
    const progADoc = await db
      .collection(COLLECTIONS.PROGRAM)
      .doc(testProgramAId)
      .get()
    const progBDoc = await db
      .collection(COLLECTIONS.PROGRAM)
      .doc(testProgramBId)
      .get()

    const countA = progADoc.data().totalEnrolledCount
    const countB = progBDoc.data().totalEnrolledCount

    if (countA === 0 && countB === 1) {
      console.log(
        '✅ Test 3 Passed! Program A count was decremented to 0 and Program B was incremented to 1.',
      )
      passCount++
    } else {
      console.error(
        `❌ Test 3 Failed! Expected Program A to be 0 and Program B to be 1, but got Program A: ${countA}, Program B: ${countB}`,
      )
      failCount++
    }
    console.log('')
  } catch (err) {
    console.error('💥 Unexpected failure during test execution:', err)
    failCount++
  } finally {
    // 8. Clean up Mock Docs
    console.log('🧹 Cleaning up mock documents...')
    const deleteBatch = db.batch()
    deleteBatch.delete(db.collection(COLLECTIONS.BRANCH).doc(testBranchId))
    deleteBatch.delete(db.collection(COLLECTIONS.PROGRAM).doc(testProgramAId))
    deleteBatch.delete(db.collection(COLLECTIONS.PROGRAM).doc(testProgramBId))
    deleteBatch.delete(db.collection(COLLECTIONS.TERM).doc(testTermId))
    deleteBatch.delete(db.collection(COLLECTIONS.CLASS).doc(testClassId))
    deleteBatch.delete(db.collection(COLLECTIONS.STUDENT).doc(testStudent1Id))
    deleteBatch.delete(db.collection(COLLECTIONS.STUDENT).doc(testStudent2Id))
    deleteBatch.delete(db.collection(COLLECTIONS.STUDENT).doc(testStudent3Id))
    deleteBatch.delete(
      db.collection(COLLECTIONS.ENROLLMENT).doc(testEnrollment1Id),
    )
    deleteBatch.delete(
      db.collection(COLLECTIONS.ENROLLMENT).doc(testEnrollment2Id),
    )
    deleteBatch.delete(
      db.collection(COLLECTIONS.ENROLLMENT).doc(testEnrollment3Id),
    )
    await deleteBatch.commit()
    console.log('✅ Database cleanup completed!')
  }

  // Final Summary
  console.log('\n======================================')
  console.log('📊 BACKEND INTEGRITY TEST RESULTS SUMMARY')
  console.log('======================================')
  console.log(`Passed: ${passCount}`)
  console.log(`Failed: ${failCount}`)
  console.log('======================================')

  if (failCount === 0) {
    console.log('🎉 ALL TESTS PASSED! DATA INTEGRITY IS PERFECT 🎉\n')
    process.exit(0)
  } else {
    console.log('⚠️ SOME TESTS FAILED! PLEASE REVIEW LOGS ⚠️\n')
    process.exit(1)
  }
}

runTests()

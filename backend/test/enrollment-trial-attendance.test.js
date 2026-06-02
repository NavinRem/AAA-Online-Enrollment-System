const assert = require('assert');
const { db } = require('../src/config/database');
const trialService = require('../src/services/trialService');
const enrollmentService = require('../src/services/enrollmentService');
const attendanceService = require('../src/services/attendanceService');
const parentService = require('../src/services/parentService');
const paymentService = require('../src/services/paymentService');

/**
 * E2E Integration Test Suite: Trial → Enrollment → Attendance
 * Runs against the Firestore emulator via service layer calls.
 */

// Shared test context populated in `before` hook
let testCtx = {};

describe('Enrollment, Trial, and Attendance E2E Flow', function () {
  this.timeout(15000);

  before(async () => {
    // Gather valid test data from the emulator database
    const termsSnap = await db.collection('terms').limit(5).get();
    if (termsSnap.empty) throw new Error('No terms in emulator. Run seed:full first.');

    let term, offering;
    for (const doc of termsSnap.docs) {
      const t = { id: doc.id, ...doc.data() };
      if (t.offerings && t.offerings.length > 0) {
        term = t;
        offering = t.offerings[0];
        break;
      }
    }
    if (!term || !offering) throw new Error('No term with offerings found.');

    // Get a parent with children
    const parentsSnap = await db.collection('parents')
      .where('isDeleted', '==', false)
      .limit(5)
      .get();
    if (parentsSnap.empty) throw new Error('No parents found in emulator.');

    let parentId, student;
    for (const doc of parentsSnap.docs) {
      const pData = await parentService.getParent(doc.id);
      if (pData.childrenInfo && pData.childrenInfo.length > 0) {
        parentId = doc.id;
        student = pData.childrenInfo[0];
        break;
      }
    }
    if (!parentId || !student) throw new Error('No parent with children found.');

    // Use a test date within the active term's bounds to ensure it's valid
    const testDate = term.startDate || `2099-12-31`;

    testCtx = {
      term,
      offering,
      parentId,
      student,
      classId: offering.classId,
      programId: offering.program?.id || offering.programId,
      branchId: offering.branchId || offering.branch?.id || 'default',
      testDate,
      sessionId: `test_session_${Date.now()}`,
    };
  });

  // ── Trial Tests ──────────────────────────────────────────────────────────

  describe('Trial Service', () => {
    let createdTrialId;

    it('should create a trial successfully', async () => {
      const trialData = {
        isGuest: false,
        parentId: testCtx.parentId,
        studentId: testCtx.student.id,
        programId: testCtx.programId,
        classId: testCtx.classId,
        branchId: testCtx.branchId,
        trialDate: testCtx.testDate,
        status: 'scheduled',
      };

      const result = await trialService.createTrial(trialData);
      createdTrialId = result.id;

      assert.ok(result.id, 'Trial should have an ID');
      assert.strictEqual(result.status, 'scheduled');
      assert.strictEqual(result.studentId, testCtx.student.id);
      assert.strictEqual(result.programId, testCtx.programId);
    });

    it('should prevent duplicate trials for same student/program/date', async () => {
      const duplicateData = {
        isGuest: false,
        parentId: testCtx.parentId,
        studentId: testCtx.student.id,
        programId: testCtx.programId,
        classId: testCtx.classId,
        branchId: testCtx.branchId,
        trialDate: testCtx.testDate,
        status: 'scheduled',
      };

      try {
        await trialService.createTrial(duplicateData);
        assert.fail('Should have thrown a duplicate error');
      } catch (err) {
        assert.ok(
          err.message.includes('already exists'),
          `Expected duplicate error but got: ${err.message}`
        );
      }
    });

    after(async () => {
      // Clean up: soft-delete the trial to avoid polluting emulator data
      if (createdTrialId) {
        await trialService.deleteTrial(createdTrialId).catch(() => {});
      }
    });
  });

  // ── Enrollment Tests ─────────────────────────────────────────────────────

  describe('Enrollment Service', () => {
    let createdEnrollmentId;

    before(async () => {
      // Clean up any pre-existing enrollment for this student + offering to avoid "already enrolled" collisions
      const offeringId = testCtx.offering.id || testCtx.offering.offeringId;
      const existingSnap = await db.collection('enrollments')
        .where('studentId', '==', testCtx.student.id)
        .where('termOfferingId', '==', offeringId)
        .get();
      
      const batch = db.batch();
      existingSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.isDeleted !== true && !['cancelled', 'deleted'].includes(String(data.status).toLowerCase())) {
          batch.update(doc.ref, { isDeleted: true, status: 'deleted', updatedAt: new Date().toISOString() });
        }
      });
      await batch.commit();
    });

    it('should create a pending enrollment and process payment successfully', async () => {
      const enrollmentData = {
        parentId: testCtx.parentId,
        studentId: testCtx.student.id,
        programId: testCtx.programId,
        classId: testCtx.classId,
        termId: testCtx.term.id,
        termOfferingId: testCtx.offering.id || testCtx.offering.offeringId,
        enrollAt: testCtx.testDate,
        status: 'pending',
        paymentStatus: 'unpaid',
        amount: 150,
      };

      const result = await enrollmentService.createEnrollment(enrollmentData);
      createdEnrollmentId = result.id;

      assert.ok(result.id, 'Enrollment should have an ID');
      assert.strictEqual(result.status, 'pending');
      assert.strictEqual(result.paymentStatus, 'unpaid');

      // Now process payment
      const paymentData = {
        enrollmentId: result.id,
        parentId: testCtx.parentId,
        amount: 150,
        method: 'credit_card',
      };
      
      const paymentRes = await paymentService.initiatePayment(paymentData);
      assert.ok(paymentRes.transactionId, 'Payment should return a transaction ID');

      await paymentService.verifyPayment(paymentRes.transactionId);

      // Verify enrollment status updated
      const updatedEnrollment = await db.collection('enrollments').doc(result.id).get();
      assert.strictEqual(updatedEnrollment.data().status, 'paid');
      assert.strictEqual(updatedEnrollment.data().paymentStatus, 'paid');
    });

    it('should prevent duplicate enrollment for same student and offering', async () => {
      const duplicateData = {
        parentId: testCtx.parentId,
        studentId: testCtx.student.id,
        programId: testCtx.programId,
        classId: testCtx.classId,
        termId: testCtx.term.id,
        termOfferingId: testCtx.offering.id || testCtx.offering.offeringId,
        enrollAt: testCtx.testDate,
        status: 'pending',
        paymentStatus: 'unpaid',
        amount: 100,
      };

      try {
        await enrollmentService.createEnrollment(duplicateData);
        assert.fail('Should have thrown a duplicate enrollment error');
      } catch (err) {
        assert.ok(
          err.message.includes('already enrolled'),
          `Expected duplicate enrollment error but got: ${err.message}`
        );
      }
    });

    after(async () => {
      // Clean up: soft-delete the enrollment
      if (createdEnrollmentId) {
        await enrollmentService.deleteEnrollment(createdEnrollmentId).catch(() => {});
      }
    });
  });

  // ── Attendance Tests ─────────────────────────────────────────────────────

  describe('Attendance Service', () => {
    it('should record attendance with history tracking', async () => {
      const statuses = { [testCtx.student.id]: 'P' };
      const resolvedScheduleId = testCtx.offering.scheduleId || testCtx.offering.schedule?.id || 'default';
      const result = await attendanceService.recordAttendance(
        testCtx.classId,
        testCtx.sessionId,
        statuses,
        testCtx.term.id,
        resolvedScheduleId
      );

      assert.ok(Array.isArray(result), 'Result should be an array');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].status, 'P');
      assert.strictEqual(result[0].studentId, testCtx.student.id);

      // Verify history was written in Firestore
      const docId = `${testCtx.sessionId}_${testCtx.student.id}`;
      const doc = await db
        .collection('terms')
        .doc(testCtx.term.id)
        .collection('classes')
        .doc(testCtx.classId)
        .collection('schedules')
        .doc(resolvedScheduleId)
        .collection('attendance')
        .doc(docId)
        .get();
      assert.ok(doc.exists, 'Attendance document should exist');
      const data = doc.data();
      assert.ok(Array.isArray(data.history), 'History field should be an array');
      assert.strictEqual(data.history.length, 1);
      assert.strictEqual(data.history[0].status, 'P');
      assert.ok(data.history[0].changedAt, 'History entry should have changedAt');
    });

    it('should retrieve attendance map for a class', async () => {
      const attendanceMap = await attendanceService.getClassAttendance(testCtx.classId);

      assert.ok(attendanceMap, 'Attendance map should exist');
      assert.ok(
        attendanceMap[testCtx.sessionId],
        'Session should exist in attendance map'
      );
      assert.strictEqual(
        attendanceMap[testCtx.sessionId][testCtx.student.id],
        'P',
        'Student status should be P'
      );
    });

    it('should append to history on status change without duplicating documents', async () => {
      // Change from P → A
      const statuses = { [testCtx.student.id]: 'A' };
      const resolvedScheduleId = testCtx.offering.scheduleId || testCtx.offering.schedule?.id || 'default';
      await attendanceService.recordAttendance(
        testCtx.classId,
        testCtx.sessionId,
        statuses,
        testCtx.term.id,
        resolvedScheduleId
      );

      // Verify the document was updated (not duplicated)
      const docId = `${testCtx.sessionId}_${testCtx.student.id}`;
      const doc = await db
        .collection('terms')
        .doc(testCtx.term.id)
        .collection('classes')
        .doc(testCtx.classId)
        .collection('schedules')
        .doc(resolvedScheduleId)
        .collection('attendance')
        .doc(docId)
        .get();
      assert.ok(doc.exists, 'Attendance document should still exist');
      const data = doc.data();

      assert.strictEqual(data.status, 'A', 'Current status should be A');
      assert.ok(Array.isArray(data.history), 'History should still be an array');
      assert.strictEqual(data.history.length, 2, 'History should have 2 entries');
      assert.strictEqual(data.history[0].status, 'P', 'First history entry should be P');
      assert.strictEqual(data.history[1].status, 'A', 'Second history entry should be A');
    });

    after(async () => {
      // Clean up: delete test attendance document
      const resolvedScheduleId = testCtx.offering.scheduleId || testCtx.offering.schedule?.id || 'default';
      const docId = `${testCtx.sessionId}_${testCtx.student.id}`;
      await db
        .collection('terms')
        .doc(testCtx.term.id)
        .collection('classes')
        .doc(testCtx.classId)
        .collection('schedules')
        .doc(resolvedScheduleId)
        .collection('attendance')
        .doc(docId)
        .delete()
        .catch(() => {});
    });
  });
});

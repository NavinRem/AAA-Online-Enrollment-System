const parentService = require('../services/parentService')
const authService = require('../services/authService')
const { db, COLLECTIONS } = require('../config/database')

exports.createParent = async (req, res) => {
  try {
    const result = await parentService.createParent(req.body)
    res.status(201).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.getAllParents = async (req, res) => {
  try {
    const parents = await parentService.getAllParents(req.query)
    res.status(200).json(parents)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getParent = async (req, res) => {
  try {
    const parent = await parentService.getParent(req.params.uid)
    res.status(200).json(parent)
  } catch (error) {
    res.status(404).json({ error: error.message })
  }
}

exports.updateParent = async (req, res) => {
  try {
    const result = await parentService.updateParent(req.params.uid, req.body)
    res.status(200).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.deleteParent = async (req, res) => {
  try {
    const result = await parentService.deleteParent(req.params.uid)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.registerParentSelf = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' })
    }

    // Force role to 'parent' — never accept a role field from public self-registration
    const result = await authService.registerAccount(
      { name, email, password, phone },
      'parent',
      COLLECTIONS.PARENT,
    )

    res.status(201).json(result)
  } catch (error) {
    const status = error.code === 'auth/email-already-exists' ? 409 : 400
    res.status(status).json({ error: error.message || 'Registration failed' })
  }
}

exports.getMyProfile = async (req, res) => {
  const doc = await db.collection(COLLECTIONS.PARENT).doc(req.user.uid).get()
  if (!doc.exists) return res.status(404).json({ error: 'Profile not found' })
  const { passwordHash: _passwordHash, ...safe } = doc.data() // never expose the hash, even to its owner
  void _passwordHash
  res.json({ id: doc.id, ...safe })
}

exports.getMyChildren = async (req, res) => {
  const snap = await db.collection(COLLECTIONS.STUDENT)
    .where('parentId', '==', req.user.uid)
    .get()
  res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
}

exports.getMyEnrollments = async (req, res) => {
  const snap = await db.collection(COLLECTIONS.ENROLLMENT)
    .where('parentId', '==', req.user.uid)
    .get()
  // Strip internal admin-only audit fields before returning to parent
  const enrollments = snap.docs.map((d) => {
    const {
      overrideReason: _overrideReason,
      overrideRemark: _overrideRemark,
      modifiedBy: _modifiedBy,
      createdBy: _createdBy,
      ...safe
    } = d.data()
    void _overrideReason
    void _overrideRemark
    void _modifiedBy
    void _createdBy
    return { id: d.id, ...safe }
  })
  res.json(enrollments)
}

exports.getMyChildAttendance = async (req, res) => {
  const { studentId } = req.params

  // Verify ownership before touching attendance data at all
  const studentDoc = await db.collection(COLLECTIONS.STUDENT).doc(studentId).get()
  if (!studentDoc.exists || studentDoc.data().parentId !== req.user.uid) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const enrollSnap = await db.collection(COLLECTIONS.ENROLLMENT)
    .where('studentId', '==', studentId)
    .where('parentId', '==', req.user.uid)
    .get()

  const classIds = [...new Set(enrollSnap.docs.map((d) => d.data().classId).filter(Boolean))]

  const results = []
  for (const classId of classIds) {
    const attDoc = await db.collection(COLLECTIONS.ATTENDANCE).doc(classId).get()
    if (!attDoc.exists) continue
    const raw = attDoc.data() // { sessionId -> { studentId -> status, ... } }
    // Filter down to ONLY this student's entries per session — never leak classmates' data
    const filtered = {}
    Object.entries(raw).forEach(([sessionId, sessionData]) => {
      if (sessionData[studentId] !== undefined) {
        filtered[sessionId] = {
          status: sessionData[studentId],
          meta: sessionData[`${studentId}_meta`] || null,
        }
      }
    })
    results.push({ classId, attendance: filtered })
  }

  res.json(results)
}

exports.getAvailableClasses = async (req, res) => {
  // Read-only browsing for self-enrollment — reuse existing class/term/branch data
  const [classesSnap, termsSnap, branchesSnap] = await Promise.all([
    db.collection(COLLECTIONS.CLASS).get(),
    db.collection(COLLECTIONS.TERM).get(),
    db.collection(COLLECTIONS.BRANCH).get(),
  ])
  res.json({
    classes: classesSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    terms: termsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    branches: branchesSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
  })
}

exports.selfEnroll = async (req, res) => {
  try {
    const { studentId, classId, termId, termOfferingId, scheduleId, branchId } = req.body

    // 1. Verify the student belongs to this parent
    const studentDoc = await db.collection(COLLECTIONS.STUDENT).doc(studentId).get()
    if (!studentDoc.exists || studentDoc.data().parentId !== req.user.uid) {
      return res.status(403).json({ error: 'You can only enroll your own children.' })
    }

    // 2. Basic capacity check (mirrors admin-side getScheduleEnrolledCount logic)
    const classDoc = await db.collection(COLLECTIONS.CLASS).doc(classId).get()
    if (!classDoc.exists) return res.status(404).json({ error: 'Class not found.' })
    // (capacity validation logic goes here — reuse/extract from your existing
    //  getScheduleCapacity/getScheduleEnrolledCount helpers so both admin and
    //  parent enrollment paths enforce identical rules)

    // 3. Create enrollment — ALWAYS unpaid, regardless of what client sends
    const enrollmentData = {
      parentId: req.user.uid,
      studentId,
      classId,
      termId: termId || '',
      termOfferingId: termOfferingId || '',
      scheduleId: scheduleId || '',
      branchId: branchId || '',
      status: 'unpaid',
      paymentStatus: 'unpaid',
      enrollmentSource: 'parent-self-enroll', // audit trail: distinguish from admin-created
      enrollAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }

    const ref = await db.collection(COLLECTIONS.ENROLLMENT).add(enrollmentData)
    res.status(201).json({ id: ref.id, ...enrollmentData })
  } catch (error) {
    res.status(400).json({ error: error.message || 'Enrollment failed' })
  }
}

exports.uploadPaymentProof = async (req, res) => {
  try {
    const { enrollmentId } = req.params
    const { proofURL, transactionId, remark } = req.body // proofURL from client-side upload to Storage first

    const enrollDoc = await db.collection(COLLECTIONS.ENROLLMENT).doc(enrollmentId).get()
    if (!enrollDoc.exists || enrollDoc.data().parentId !== req.user.uid) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    await db.collection(COLLECTIONS.ENROLLMENT).doc(enrollmentId).update({
      paymentProofURL: proofURL,
      paymentProofSubmittedAt: new Date().toISOString(),
      transactionId: transactionId || '',
      paymentStatus: 'verifying', // distinct from 'unpaid' — signals admin review needed
      remark: remark || '',
    })

    res.json({ success: true, message: 'Payment proof submitted for admin verification.' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}
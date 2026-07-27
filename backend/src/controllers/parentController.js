const parentService = require('../services/parentService')
const authService = require('../services/authService')
const { db, COLLECTIONS } = require('../config/database')
const { getAuth } = require('firebase-admin/auth')

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
      return res
        .status(400)
        .json({ error: 'Name, email, and password are required.' })
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 6 characters.' })
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

exports.registerParentGoogle = async (req, res) => {
  try {
    const { idToken, uid: bodyUid, email, name, photoURL } = req.body
    let uid = bodyUid
    let decodedEmail = email
    let decodedName = name
    let decodedPhoto = photoURL

    const authHeader = req.headers.authorization
    const tokenToVerify =
      idToken ||
      (authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split('Bearer ')[1]
        : null)

    if (tokenToVerify) {
      try {
        const decoded = await getAuth().verifyIdToken(tokenToVerify)
        uid = decoded.uid
        decodedEmail = decoded.email || decodedEmail
        decodedName = decoded.name || decodedName
        decodedPhoto = decoded.picture || decodedPhoto
      } catch (tokenErr) {
        console.warn('ID Token verification warning:', tokenErr.message)
      }
    }

    if (!uid) {
      return res
        .status(400)
        .json({ error: 'Valid Google user ID (uid) or token is required.' })
    }

    // 1. Ensure custom claim role is 'parent'
    try {
      const userRecord = await getAuth().getUser(uid)
      if (
        !userRecord.customClaims ||
        userRecord.customClaims.role !== 'parent'
      ) {
        await getAuth().setCustomUserClaims(uid, { role: 'parent' })
      }
    } catch (authErr) {
      console.warn('Set custom claim warning:', authErr.message)
    }

    // 2. Ensure Firestore document exists in parents collection
    const docRef = db.collection(COLLECTIONS.PARENT).doc(uid)
    const doc = await docRef.get()
    const now = new Date().toISOString()

    if (!doc.exists) {
      await docRef.set({
        name: decodedName || decodedEmail?.split('@')[0] || 'Parent User',
        email: decodedEmail || `${uid}@google.aaa.edu`,
        phone: '',
        profileURL: decodedPhoto || null,
        role: 'parent',
        provider: 'google',
        childrenInfo: [],
        createdAt: now,
        updatedAt: now,
      })
    } else {
      const updateData = { updatedAt: now, role: 'parent' }
      if (!doc.data().name && decodedName) updateData.name = decodedName
      if (!doc.data().profileURL && decodedPhoto)
        updateData.profileURL = decodedPhoto
      await docRef.update(updateData)
    }

    res.status(200).json({
      uid,
      role: 'parent',
      message: 'Google SSO parent profile ready.',
      isNew: !doc.exists,
    })
  } catch (error) {
    console.error('registerParentGoogle error:', error)
    res
      .status(500)
      .json({ error: error.message || 'Google SSO verification failed' })
  }
}

exports.resolveLoginIdentifier = async (req, res) => {
  try {
    const { identifier } = req.body
    if (!identifier) {
      return res.status(400).json({ error: 'Identifier is required.' })
    }

    const clean = identifier.trim()
    if (clean.includes('@')) {
      return res.json({ email: clean })
    }

    // Lookup by exact phone number across parents collection
    const snap = await db
      .collection(COLLECTIONS.PARENT)
      .where('phone', '==', clean)
      .limit(1)
      .get()

    if (!snap.empty && snap.docs[0].data().email) {
      return res.json({ email: snap.docs[0].data().email })
    }

    // Fallback to synthetic phone email if not found
    const cleanPhone = clean.replace(/[^a-zA-Z0-9+_]/g, '')
    const syntheticEmail = `${cleanPhone.toLowerCase()}@telegram.aaa.edu`
    return res.json({ email: syntheticEmail })
  } catch (error) {
    res.status(500).json({ error: error.message })
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
  try {
    const [snap, enrollSnap, branchesSnap, programsSnap] = await Promise.all([
      db
        .collection(COLLECTIONS.STUDENT)
        .where('parentId', '==', req.user.uid)
        .get(),
      db
        .collection(COLLECTIONS.ENROLLMENT)
        .where('parentId', '==', req.user.uid)
        .get(),
      db.collection(COLLECTIONS.BRANCH).get(),
      db.collection(COLLECTIONS.PROGRAM).get(),
    ])
    const branchesMap = new Map(
      branchesSnap.docs.map((d) => [
        d.id,
        d.data().name || d.data().code || d.id,
      ]),
    )
    const programsMap = new Map(
      programsSnap.docs.map((d) => [d.id, d.data().name || 'Program']),
    )
    const enrollments = enrollSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((e) => !e.isDeleted)

    const children = snap.docs.map((d) => {
      const data = d.data()
      const studentId = d.id
      const stEnrollments = enrollments.filter(
        (e) => (e.studentId || e.student?.id) === studentId,
      )
      const activeCount = stEnrollments.filter((e) => {
        const st = (e.paymentStatus || e.status || '').toLowerCase()
        return (
          st === 'paid' ||
          st === 'confirmed' ||
          st === 'active' ||
          st === 'verifying' ||
          st === 'unpaid'
        )
      }).length

      return {
        id: studentId,
        ...data,
        name: data.name || data.fullName || 'Student',
        branchName: branchesMap.get(data.branchId) || data.branchId || 'AEON',
        activeEnrollmentsCount: activeCount,
        programsList: [
          ...new Set(
            stEnrollments
              .map(
                (e) =>
                  e.programName ||
                  e.program?.name ||
                  programsMap.get(e.programId),
              )
              .filter(Boolean),
          ),
        ],
      }
    })
    res.json(children)
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed fetching children' })
  }
}

exports.getMyEnrollments = async (req, res) => {
  try {
    const [
      snap,
      studentsSnap,
      classesSnap,
      programsSnap,
      termsSnap,
      branchesSnap,
    ] = await Promise.all([
      db
        .collection(COLLECTIONS.ENROLLMENT)
        .where('parentId', '==', req.user.uid)
        .get(),
      db.collection(COLLECTIONS.STUDENT).get(),
      db.collection(COLLECTIONS.CLASS).get(),
      db.collection(COLLECTIONS.PROGRAM).get(),
      db.collection(COLLECTIONS.TERM).get(),
      db.collection(COLLECTIONS.BRANCH).get(),
    ])

    const studentsMap = new Map(
      studentsSnap.docs.map((d) => [d.id, { id: d.id, ...d.data() }]),
    )
    const classesMap = new Map(
      classesSnap.docs.map((d) => [d.id, { id: d.id, ...d.data() }]),
    )
    const programsMap = new Map(
      programsSnap.docs.map((d) => [d.id, { id: d.id, ...d.data() }]),
    )
    const termsMap = new Map(
      termsSnap.docs.map((d) => [d.id, { id: d.id, ...d.data() }]),
    )
    const branchesMap = new Map(
      branchesSnap.docs.map((d) => [
        d.id,
        d.data().name || d.data().code || d.id,
      ]),
    )

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

      const stId = safe.studentId || safe.student?.id
      const stObj = studentsMap.get(stId) || {}
      const clId = safe.classId || safe.class?.id
      const clObj = classesMap.get(clId) || {}
      const prId = safe.programId || safe.program?.id || clObj.programId
      const prObj = programsMap.get(prId) || {}
      const tmId = safe.termId || safe.term?.id || clObj.termId
      const tmObj = termsMap.get(tmId) || {}

      const rawBranch =
        safe.branchId ||
        clObj.branchId ||
        clObj.branchIds?.[0] ||
        stObj.branchId ||
        'AEON'
      const branchVal = branchesMap.get(rawBranch) || rawBranch
      const branchClean =
        typeof branchVal === 'object'
          ? branchVal.abbr || branchVal.name || branchVal.id || 'AEON'
          : String(branchVal)
      const branchName = branchClean.toUpperCase()

      const programName =
        safe.programName ||
        safe.program?.name ||
        prObj.name ||
        clObj.programName ||
        clObj.name ||
        'Enrolled Class'
      const scheduleStr =
        safe.schedule ||
        clObj.schedule ||
        safe.class?.schedule ||
        'Regular Schedule'
      const schedule =
        typeof scheduleStr === 'object'
          ? `${scheduleStr.day || ''} @ ${scheduleStr.time || ''}`.trim() ||
            'Regular Schedule'
          : scheduleStr

      const rawInst =
        safe.instructor ||
        clObj.instructor ||
        clObj.teacherName ||
        clObj.teachers ||
        'Faculty'
      const instructor = Array.isArray(rawInst)
        ? rawInst
            .map((t) =>
              typeof t === 'object' ? t.name || 'Faculty' : String(t),
            )
            .join(', ') || 'Faculty'
        : typeof rawInst === 'object'
          ? rawInst.name || 'Faculty'
          : String(rawInst)

      const amount = safe.amount || prObj.fee || clObj.fee || safe.fee || 150
      const studentName =
        safe.studentName || safe.student?.name || stObj.name || 'Student'
      const termName =
        safe.termName || tmObj.name || tmObj.title || 'Academic Term'
      const statusStr = (
        safe.paymentStatus ||
        safe.status ||
        'unpaid'
      ).toLowerCase()

      const branchObj =
        typeof branchVal === 'object'
          ? {
              id: rawBranch,
              name: branchVal.name || branchName,
              abbr: branchVal.abbr || branchName,
              color: branchVal.color || 'blue',
            }
          : {
              id: branchName,
              name: branchName,
              abbr: branchName,
              color:
                branchName === 'FM' || branchName === 'SEN SOK'
                  ? 'purple'
                  : 'blue',
            }
      const branchColor = branchObj.color
      const profileURL =
        prObj.profileURL ||
        prObj.image ||
        prObj.photoUrl ||
        clObj.profileURL ||
        safe.profileURL ||
        ''

      return {
        id: d.id,
        ...safe,
        studentId: stId,
        studentName,
        studentObj: {
          id: stId,
          name: studentName,
          level: stObj.level || '',
          profileURL: stObj.profileURL || '',
        },
        classId: clId,
        classObj: {
          id: clId,
          name: clObj.name || programName,
          schedule,
          instructor,
          profileURL,
        },
        programId: prId,
        programName,
        programObj: {
          id: prId,
          name: programName,
          fee: amount,
          code: prObj.code || '',
          profileURL,
        },
        termId: tmId,
        termName,
        branchId: branchName,
        branchName,
        branchObj,
        branchColor,
        profileURL,
        schedule,
        instructor,
        amount,
        status: statusStr,
        paymentStatus: statusStr,
      }
    })

    res.json(enrollments)
  } catch (err) {
    res
      .status(500)
      .json({ error: err.message || 'Failed fetching enrollments' })
  }
}

exports.getMyChildAttendance = async (req, res) => {
  const { studentId } = req.params

  // Verify ownership before touching attendance data at all
  const studentDoc = await db
    .collection(COLLECTIONS.STUDENT)
    .doc(studentId)
    .get()
  if (!studentDoc.exists || studentDoc.data().parentId !== req.user.uid) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const enrollSnap = await db
    .collection(COLLECTIONS.ENROLLMENT)
    .where('studentId', '==', studentId)
    .where('parentId', '==', req.user.uid)
    .get()

  const classIds = [
    ...new Set(enrollSnap.docs.map((d) => d.data().classId).filter(Boolean)),
  ]

  const results = []
  for (const classId of classIds) {
    const attDoc = await db
      .collection(COLLECTIONS.ATTENDANCE)
      .doc(classId)
      .get()
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
  try {
    // Read-only browsing for self-enrollment — reuse existing class/term/branch/program data
    const [classesSnap, termsSnap, branchesSnap, programsSnap] =
      await Promise.all([
        db.collection(COLLECTIONS.CLASS).get(),
        db.collection(COLLECTIONS.TERM).get(),
        db.collection(COLLECTIONS.BRANCH).get(),
        db.collection(COLLECTIONS.PROGRAM).get(),
      ])

    const classes = classesSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((c) => !c.isDeleted && (c.status === 'active' || !c.status))
    const terms = termsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
    const branches = branchesSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
    const programs = programsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))

    const offerings = []

    // Helper to safely format instructor name
    const resolveInstructorName = (val) => {
      if (!val) return 'Faculty'
      if (typeof val === 'string') return val
      if (Array.isArray(val)) {
        return (
          val
            .map((t) =>
              typeof t === 'object' ? t.name || 'Faculty' : String(t),
            )
            .join(', ') || 'Faculty'
        )
      }
      if (typeof val === 'object') return val.name || 'Faculty'
      return String(val)
    }

    // Helper to resolve branch string ID cleanly
    const resolveBranchClean = (val) => {
      if (!val) return 'AEON'
      if (typeof val === 'string') return val.toUpperCase()
      if (typeof val === 'object')
        return (val.abbr || val.name || val.id || 'AEON').toUpperCase()
      return String(val).toUpperCase()
    }

    // Helper to resolve branch obj cleanly
    const resolveBranchObj = (cleanBranch) => {
      const match = branches.find(
        (b) =>
          String(b.id).toUpperCase() === cleanBranch ||
          (b.abbr || '').toUpperCase() === cleanBranch ||
          (b.name || '').toUpperCase() === cleanBranch,
      )
      return match
        ? {
            id: match.id,
            name: match.name,
            abbr: match.abbr,
            color: match.color || 'blue',
          }
        : {
            id: cleanBranch,
            name: cleanBranch,
            abbr: cleanBranch,
            color:
              cleanBranch === 'FM' || cleanBranch === 'SEN SOK'
                ? 'purple'
                : 'blue',
          }
    }

    // Helper to resolve program profileURL
    const resolveProgramURL = (progId, progName, fallbackUrl) => {
      if (fallbackUrl) return fallbackUrl
      const match = programs.find(
        (p) =>
          p.id === progId ||
          (p.name || '').toLowerCase().trim() ===
            (progName || '').toLowerCase().trim(),
      )
      return match?.profileURL || match?.image || match?.photoUrl || ''
    }

    // 1. Extract offerings from Active / Upcoming terms (e.g. T4-2026, T3-2026)
    terms.forEach((t) => {
      const st = (t.status || '').toLowerCase()
      if (st !== 'active' && st !== 'upcoming') return
      const termOfferings = Array.isArray(t.offerings)
        ? t.offerings
        : t.offerings && typeof t.offerings === 'object'
          ? Object.values(t.offerings)
          : []

      termOfferings.forEach((off, idx) => {
        const scheduleStr =
          typeof off.schedule === 'string'
            ? off.schedule
            : off.schedule
              ? `${off.schedule.day || ''} @ ${off.schedule.time || ''}`.trim()
              : ''

        const cleanBranch = resolveBranchClean(
          off.branchId || off.branch || t.branchIds?.[0],
        )
        const branchObj = resolveBranchObj(cleanBranch)
        const cleanInstructor = resolveInstructorName(
          off.instructor || off.teacherName || off.teachers || t.instructor,
        )
        const uniqueKey = `${t.id}_off_${idx}_${off.classId || off.id || 'cls'}_${(scheduleStr || '').replace(/[^a-zA-Z0-9]/g, '')}`
        const programName =
          off.program?.name || off.programName || off.name || 'Enrolled Class'
        const programId = off.program?.id || off.programId || ''
        const profileURL = resolveProgramURL(
          programId,
          programName,
          off.profileURL || off.program?.profileURL,
        )

        offerings.push({
          id: uniqueKey,
          classId: off.classId || off.id || '',
          termId: t.id,
          termName: t.name || t.title || 'Term Evaluation',
          termOfferingId: off.id || uniqueKey,
          programId,
          programName,
          branchId: cleanBranch,
          branchObj,
          branchColor: branchObj.color,
          profileURL,
          scheduleId: off.schedule?.id || off.scheduleId || '',
          schedule: scheduleStr || 'Regular Schedule',
          amount: off.amount || off.fee || t.fee || 150,
          capacity: off.capacity || off.schedule?.capacity || 20,
          seatsAvailable: off.capacity
            ? Math.max(0, off.capacity - (off.enrolledCount || 0))
            : null,
          instructor: cleanInstructor,
        })
      })
    })

    // 2. Also include general active classes that don't duplicate a term offering classId
    const termClassIds = new Set(
      offerings.map((o) => o.classId).filter(Boolean),
    )
    classes.forEach((c) => {
      if (termClassIds.has(c.id)) return
      const cleanBranch = resolveBranchClean(
        c.branchIds?.[0] || c.branches?.[0] || c.branchId,
      )
      const branchObj = resolveBranchObj(cleanBranch)
      const cleanInstructor = resolveInstructorName(
        c.instructor || c.teacherName || c.teachers,
      )
      const programId = c.programId || c.program?.id || ''
      const programName = c.program?.name || c.name || 'Class Program'
      const profileURL = resolveProgramURL(
        programId,
        programName,
        c.profileURL || c.program?.profileURL,
      )

      if (c.schedules && Array.isArray(c.schedules) && c.schedules.length > 0) {
        c.schedules.forEach((sched, idx) => {
          const uniqueKey = `${c.id}_sched_${sched.id || idx}`
          offerings.push({
            id: uniqueKey,
            classId: c.id,
            termId: '',
            termName: 'Ongoing Regular Class',
            termOfferingId: '',
            programId,
            programName,
            branchId: cleanBranch,
            branchObj,
            branchColor: branchObj.color,
            profileURL,
            scheduleId: sched.id || '',
            schedule: `${sched.day || 'Weekly'} @ ${sched.time || 'TBA'}`,
            amount: c.fee || c.amount || 150,
            capacity: sched.capacity || c.capacity || 20,
            seatsAvailable: sched.capacity || c.capacity || null,
            instructor: cleanInstructor,
          })
        })
      } else {
        offerings.push({
          id: c.id,
          classId: c.id,
          termId: '',
          termName: 'Ongoing Regular Class',
          termOfferingId: '',
          programId,
          programName,
          branchId: cleanBranch,
          branchObj,
          branchColor: branchObj.color,
          profileURL,
          scheduleId: '',
          schedule: c.schedule || 'Flexible Schedule',
          amount: c.fee || c.amount || 150,
          capacity: c.capacity || 20,
          seatsAvailable: c.capacity || null,
          instructor: cleanInstructor,
        })
      }
    })

    res.json({
      offerings,
      classes,
      terms,
      branches,
      programs,
    })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed fetching classes' })
  }
}

exports.selfEnroll = async (req, res) => {
  try {
    const {
      studentId,
      classId,
      termId,
      termOfferingId,
      scheduleId,
      branchId,
      amount,
      programName,
      schedule,
    } = req.body

    // 1. Verify the student belongs to this parent
    const studentDoc = await db
      .collection(COLLECTIONS.STUDENT)
      .doc(studentId)
      .get()
    if (!studentDoc.exists || studentDoc.data().parentId !== req.user.uid) {
      return res
        .status(403)
        .json({ error: 'You can only enroll your own children.' })
    }

    // 2. Capacity validation if class exists
    if (classId) {
      const classDoc = await db.collection(COLLECTIONS.CLASS).doc(classId).get()
      // If class exists, verify status
      if (classDoc.exists && classDoc.data().isDeleted) {
        return res
          .status(400)
          .json({ error: 'This class is no longer active.' })
      }
    }

    // 3. Create enrollment — ALWAYS unpaid, regardless of what client sends
    const enrollmentData = {
      parentId: req.user.uid,
      studentId,
      classId: classId || '',
      termId: termId || '',
      termOfferingId: termOfferingId || '',
      scheduleId: scheduleId || '',
      branchId: branchId || 'AEON',
      amount: amount || 150,
      programName: programName || 'Enrolled Program',
      schedule: schedule || 'Regular Schedule',
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

    const enrollDoc = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .doc(enrollmentId)
      .get()
    if (!enrollDoc.exists || enrollDoc.data().parentId !== req.user.uid) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    await db
      .collection(COLLECTIONS.ENROLLMENT)
      .doc(enrollmentId)
      .update({
        paymentProofURL: proofURL,
        paymentProofSubmittedAt: new Date().toISOString(),
        transactionId: transactionId || '',
        paymentStatus: 'verifying', // distinct from 'unpaid' — signals admin review needed
        remark: remark || '',
      })

    res.json({
      success: true,
      message: 'Payment proof submitted for admin verification.',
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

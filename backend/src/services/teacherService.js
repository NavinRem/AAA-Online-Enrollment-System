const { db, COLLECTIONS } = require('../config/database')
const authService = require('./authService')
const profileHelper = require('../utils/profileHelper')
const firestoreHelper = require('../utils/firestoreHelper')
const {
  validateTeacher,
  validateUpdateTeacher,
} = require('../validators/teacherValidator')

class TeacherService {
  async createTeacher(teacherData) {
    const validatedProfile = validateTeacher(teacherData)

    // Contact Uniqueness Check (Phone)
    if (validatedProfile.phone) {
      const phoneSnap = await db
        .collection(COLLECTIONS.TEACHER)
        .where('phone', '==', validatedProfile.phone)
        .get()
      const exists = phoneSnap.docs.some((d) => d.data().isDeleted !== true)
      if (exists) {
        throw new Error(
          `A teacher with phone number "${validatedProfile.phone}" already exists.`,
        )
      }
    }
    const finalPassword = teacherData.password || 'Temporary123'
    return authService.registerAccount(
      { ...validatedProfile, password: finalPassword },
      'teacher',
      COLLECTIONS.TEACHER,
    )
  }

  async getAllTeachers(filters = {}) {
    let query = db.collection(COLLECTIONS.TEACHER)

    if (filters.status) query = query.where('status', '==', filters.status)

    const snapshot = await query.get()
    return snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((t) => t.isDeleted !== true)
  }

  async getTeacher(id) {
    if (!id) throw new Error('Teacher ID is required')
    const doc = await db.collection(COLLECTIONS.TEACHER).doc(id).get()
    if (!doc.exists) throw new Error('Teacher not found')
    return { id: doc.id, ...doc.data() }
  }

  async updateTeacher(id, updateData) {
    if (!id) throw new Error('Teacher ID is required')
    const validatedData = validateUpdateTeacher(updateData)
    validatedData.updatedAt = new Date().toISOString()
    const teacherRef = db.collection(COLLECTIONS.TEACHER).doc(id)

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(teacherRef)
      if (!doc.exists) throw new Error('Teacher not found')

      transaction.update(teacherRef, validatedData)

      if (
        validatedData.name ||
        validatedData.profileURL !== undefined ||
        validatedData.email !== undefined ||
        validatedData.status !== undefined ||
        validatedData.category !== undefined ||
        validatedData.phone !== undefined ||
        validatedData.programIds !== undefined
      ) {
        const newData = { ...doc.data(), ...validatedData }
        const snapshot = profileHelper.getTeacherSnapshot(id, newData)
        await this.syncClassesWithTeacher(id, snapshot)
      }
    })

    return { id, ...validatedData }
  }

  async deleteTeacher(id) {
    if (!id) throw new Error('Teacher ID is required')

    const teacherRef = db.collection(COLLECTIONS.TEACHER).doc(id)
    const teacherDoc = await teacherRef.get()
    if (!teacherDoc.exists) throw new Error('Teacher not found')

    await teacherRef.update({
      isDeleted: true,
      status: 'deleted',
      updatedAt: new Date().toISOString(),
    })

    return { message: 'Teacher deleted successfully (Soft delete)' }
  }

  async getAssignments(teacherId) {
    if (!teacherId) throw new Error('Teacher ID is required')

    const termsSnap = await db
      .collection(COLLECTIONS.TERM)
      .where('isDeleted', '==', false)
      .get()
    const assignments = []

    termsSnap.forEach((doc) => {
      const termData = doc.data()
      const offeringsArray = Array.isArray(termData.offerings)
        ? termData.offerings
        : termData.offerings && typeof termData.offerings === 'object'
          ? Object.values(termData.offerings)
          : []

      offeringsArray.forEach((offering) => {
        const teachers = offering.teachers || []
        const isAssigned = teachers.some((t) => t.id === teacherId)
        const isInSessions = (offering.sessionTeachers || []).some((st) => {
          if (!st) return false
          if (st.teachers && Array.isArray(st.teachers))
            return st.teachers.some((t) => t && t.id === teacherId)
          if (Array.isArray(st)) return st.some((t) => t && t.id === teacherId)
          return st && st.id === teacherId
        })

        if (isAssigned || isInSessions) {
          assignments.push({
            termId: doc.id,
            termName: termData.name,
            ...offering,
          })
        }
      })
    })

    return assignments
  }

  async assignToClass(teacherId, termId, offeringId) {
    if (!teacherId || !termId || !offeringId)
      throw new Error('All parameters are required')

    const [teacherDoc, termRef] = await Promise.all([
      db.collection(COLLECTIONS.TEACHER).doc(teacherId).get(),
      db.collection(COLLECTIONS.TERM).doc(termId),
    ])

    if (!teacherDoc.exists) throw new Error('Teacher not found')
    const teacherData = teacherDoc.data()
    const teacherSnapshot = profileHelper.getTeacherSnapshot(
      teacherId,
      teacherData,
    )

    await db.runTransaction(async (transaction) => {
      const termDoc = await transaction.get(termRef)
      if (!termDoc.exists) throw new Error('Term not found')

      const termData = termDoc.data()
      const offerings = Array.isArray(termData.offerings)
        ? [...termData.offerings]
        : termData.offerings && typeof termData.offerings === 'object'
          ? Object.values(termData.offerings)
          : []
      const idx = offerings.findIndex(
        (o) => String(o.offeringId) === String(offeringId),
      )

      if (idx === -1) throw new Error('Offering not found in this term')

      const offering = offerings[idx]
      const currentTeachers = offering.teachers || []

      if (currentTeachers.some((t) => t.id === teacherId)) {
        throw new Error('Teacher is already assigned to this class')
      }

      offerings[idx] = {
        ...offering,
        teachers: [...currentTeachers, teacherSnapshot],
        updatedAt: new Date().toISOString(),
      }

      transaction.update(termRef, {
        offerings,
        updatedAt: new Date().toISOString(),
      })

      const teacherRef = db.collection(COLLECTIONS.TEACHER).doc(teacherId)
      const progName =
        offering.program?.name || offering.name || 'Class Offering'
      transaction.update(teacherRef, {
        updatedAt: new Date().toISOString(),
        auditAction: `Assigned Class: ${progName}`,
      })
    })

    return { message: 'Teacher assigned successfully' }
  }

  async unassignFromClass(teacherId, termId, offeringId) {
    if (!teacherId || !termId || !offeringId)
      throw new Error('All parameters are required')

    const termRef = db.collection(COLLECTIONS.TERM).doc(termId)

    await db.runTransaction(async (transaction) => {
      const termDoc = await transaction.get(termRef)
      if (!termDoc.exists) throw new Error('Term not found')

      const termData = termDoc.data()
      const offerings = Array.isArray(termData.offerings)
        ? [...termData.offerings]
        : termData.offerings && typeof termData.offerings === 'object'
          ? Object.values(termData.offerings)
          : []
      const idx = offerings.findIndex(
        (o) => String(o.offeringId) === String(offeringId),
      )

      if (idx === -1) throw new Error('Offering not found in this term')

      const offering = offerings[idx]
      const currentTeachers = offering.teachers || []

      offerings[idx] = {
        ...offering,
        teachers: currentTeachers.filter((t) => t.id !== teacherId),
        updatedAt: new Date().toISOString(),
      }

      transaction.update(termRef, {
        offerings,
        updatedAt: new Date().toISOString(),
      })

      const teacherRef = db.collection(COLLECTIONS.TEACHER).doc(teacherId)
      const progName =
        offering.program?.name || offering.name || 'Class Offering'
      transaction.update(teacherRef, {
        updatedAt: new Date().toISOString(),
        auditAction: `Unassigned Class: ${progName}`,
      })
    })

    return { message: 'Teacher unassigned successfully' }
  }

  async syncClassesWithTeacher(teacherId, teacherSnapshot) {
    const snapshot = await db
      .collection(COLLECTIONS.CLASS)
      .where('teacherIds', 'array-contains', teacherId)
      .get()

    if (snapshot.empty) return

    const writes = snapshot.docs.map((doc) => {
      const data = doc.data()
      const teachers = (data.teachers || []).map((t) =>
        t.id === teacherId ? teacherSnapshot : t,
      )
      return {
        ref: doc.ref,
        data: {
          teachers,
          updatedAt: new Date().toISOString(),
        },
      }
    })

    await firestoreHelper.chunkedUpdate(writes)
  }
}

module.exports = new TeacherService()

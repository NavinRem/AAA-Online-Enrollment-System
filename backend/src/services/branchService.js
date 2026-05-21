const { db, COLLECTIONS } = require('../config/database')
const profileHelper = require('../utils/profileHelper')
const {
  validateBranch,
  validateUpdateBranch,
} = require('../validators/branchValidator')

class BranchService {
  async createBranch(data) {
    const validatedData = validateBranch(data)
    const id = validatedData.abbr

    const ref = db.collection(COLLECTIONS.BRANCH).doc(id)
    const doc = await ref.get()
    if (doc.exists)
      throw new Error(`Branch with abbreviation "${id}" already exists`)

    // Name Uniqueness Check
    const nameSnap = await db
      .collection(COLLECTIONS.BRANCH)
      .where('name', '==', validatedData.name)
      .limit(1)
      .get()
    if (!nameSnap.empty) {
      throw new Error(`A branch named "${validatedData.name}" already exists.`)
    }

    await ref.set(validatedData)
    return { id, ...validatedData }
  }

  async getAllBranches() {
    const snapshot = await db.collection(COLLECTIONS.BRANCH).get()
    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((b) => b.isDeleted !== true)
  }

  async getBranch(id) {
    if (!id) throw new Error('Branch ID is required')
    const doc = await db.collection(COLLECTIONS.BRANCH).doc(id).get()
    if (!doc.exists) throw new Error('Branch not found')
    return { id: doc.id, ...doc.data() }
  }

  async updateBranch(id, data) {
    if (!id) throw new Error('Branch ID is required')
    const validatedUpdate = validateUpdateBranch(data)
    const branchRef = db.collection(COLLECTIONS.BRANCH).doc(id)
    const branchDoc = await branchRef.get()

    if (!branchDoc.exists) throw new Error('Branch not found')

    const batch = db.batch()
    batch.update(branchRef, validatedUpdate)

    const criticalFields = ['name', 'abbr', 'location', 'phone', 'color']
    const shouldSync = Object.keys(validatedUpdate).some((k) =>
      criticalFields.includes(k),
    )

    if (shouldSync) {
      const updatedData = { ...branchDoc.data(), ...validatedUpdate }
      const snapshot = profileHelper.getBranchSnapshot(id, updatedData)

      const classesSnap = await db
        .collection(COLLECTIONS.CLASS)
        .where('branchId', '==', id)
        .get()

      classesSnap.forEach((doc) => {
        batch.update(doc.ref, {
          branch: snapshot,
          updatedAt: new Date().toISOString(),
        })
      })
    }

    await batch.commit()
    return { id, ...branchDoc.data(), ...validatedUpdate }
  }

  async deleteBranch(id) {
    if (!id) throw new Error('Branch ID is required')
    const branchRef = db.collection(COLLECTIONS.BRANCH).doc(id)
    const branchDoc = await branchRef.get()
    if (!branchDoc.exists) throw new Error('Branch not found')

    await branchRef.update({
      isDeleted: true,
      status: 'deleted',
      updatedAt: new Date().toISOString(),
    })

    return { id, message: 'Branch deleted successfully (Soft delete)' }
  }

  async calculateAndSyncStats(branchId) {
    if (!branchId) return
    const today = new Date().toISOString().split('T')[0]
    const [enrollmentsSnap, classesSnap] = await Promise.all([
      db
        .collection(COLLECTIONS.ENROLLMENT)
        .where('branchId', '==', branchId)
        .get(),
      db.collection(COLLECTIONS.CLASS).where('branchId', '==', branchId).get(),
    ])

    const enrollments = enrollmentsSnap.docs
      .map((d) => d.data())
      .filter((e) => e.isDeleted !== true)
    const classes = classesSnap.docs
      .map((d) => d.data())
      .filter((c) => c.isDeleted !== true)

    const enrolledStudentIds = new Set(
      enrollments.map((e) => e.studentId).filter(Boolean),
    )

    const programIds = new Set(classes.map((c) => c.programId).filter(Boolean))

    let newTodayCount = 0
    let totalRevenue = 0
    let pendingRevenue = 0

    enrollments.forEach((data) => {
      const status = data.paymentStatus?.toLowerCase()
      const amount = data.amount

      if (status === 'paid') {
        totalRevenue += amount
      } else {
        pendingRevenue += amount
      }

      const createdAt = (data.createdAt || '').split('T')[0]
      if (createdAt === today) newTodayCount++
    })

    const stats = {
      studentCount: enrolledStudentIds.size,
      programCount: programIds.size,
      classCount: classes.length,
      newTodayCount,
      totalRevenue,
      pendingRevenue,
      updatedAt: new Date().toISOString(),
    }

    await db.collection(COLLECTIONS.BRANCH).doc(branchId).update(stats)
    return stats
  }
}

module.exports = new BranchService()

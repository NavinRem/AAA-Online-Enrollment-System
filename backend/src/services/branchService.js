const { db, COLLECTIONS } = require('../config/database')
const {
  validateBranch,
  validateUpdateBranch,
} = require('../validators/branchValidator')

class BranchService {
  async getAllBranches() {
    const snapshot = await db.collection(COLLECTIONS.BRANCH).get()
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  }

  async getBranch(id) {
    const doc = await db.collection(COLLECTIONS.BRANCH).doc(id).get()
    if (!doc.exists) return null
    return { id: doc.id, ...doc.data() }
  }

  async createBranch(data) {
    const validatedData = validateBranch(data)
    const id = validatedData.abbr

    const ref = db.collection(COLLECTIONS.BRANCH).doc(id)
    const doc = await ref.get()
    if (doc.exists)
      throw new Error(`Branch with abbreviation "${id}" already exists`)

    await ref.set(validatedData)
    return { id, ...validatedData }
  }

  async updateBranch(id, data) {
    const validatedUpdate = validateUpdateBranch(data)
    const ref = db.collection(COLLECTIONS.BRANCH).doc(id)
    const doc = await ref.get()
    if (!doc.exists) throw new Error('Branch not found')

    await ref.update(validatedUpdate)
    return { id, ...doc.data(), ...validatedUpdate }
  }


  async deleteBranch(id) {
    const ref = db.collection(COLLECTIONS.BRANCH).doc(id)
    const doc = await ref.get()
    if (!doc.exists) throw new Error('Branch not found')

    await ref.delete()
    return { id, message: 'Branch deleted successfully' }
  }

  async getBranchSnapshot(id, data) {
    if (!id || !data) return null
    return { id, name: data.name, abbr: data.abbr }
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
    const classes = classesSnap.docs

    const enrolledStudentIds = new Set(
      enrollments.map((d) => d.data().studentId).filter(Boolean),
    )

    const programIds = new Set(
      classes.map((d) => d.data().programId).filter(Boolean),
    )

    let newTodayCount = 0
    let totalRevenue = 0
    let pendingRevenue = 0

    enrollments.forEach((doc) => {
      const data = doc.data()
      const status = data.paymentStatus.toLowerCase()
      const amount = data.amount

      if (status === 'paid') {
        totalRevenue += amount
      } else {
        pendingRevenue += amount
      }

      const createdAt = data.createdAt?.toDate
        ? data.createdAt.toDate().toISOString().split('T')[0]
        : (data.createdAt || '').split('T')[0]
      if (createdAt === today) newTodayCount++
    })

    const stats = {
      studentCount: enrolledStudentIds.size,
      programCount: programIds.size,
      classCount: classes.length,
      newTodayCount,
      totalRevenue,
      pendingRevenue,
      lastUpdate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await db.collection(COLLECTIONS.BRANCH).doc(branchId).update(stats)
    return stats
  }
}

module.exports = new BranchService()


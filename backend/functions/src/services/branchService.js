const { db, COLLECTIONS } = require('../config/database')

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
    const id = data.abbr?.toUpperCase().trim()
    if (!id) throw new Error('Branch Abbreviation is required')
    if (!data.name) throw new Error('Branch Name is required')

    const ref = db.collection(COLLECTIONS.BRANCH).doc(id)
    const doc = await ref.get()
    if (doc.exists)
      throw new Error(`Branch with abbreviation "${id}" already exists`)

    const branchData = {
      name: data.name.trim(),
      abbr: id,
      location: data.location?.trim() || '',
      // Calculated stats — initialized at 0, auto-updated by event triggers
      studentCount: 0,
      programCount: 0,
      sessionCount: 0,
      newTodayCount: 0,
      totalRevenue: 0,
      pendingRevenue: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await ref.set(branchData)
    return { id, ...branchData }
  }

  async updateBranch(id, data) {
    const ref = db.collection(COLLECTIONS.BRANCH).doc(id)
    const doc = await ref.get()
    if (!doc.exists) throw new Error('Branch not found')

    // Only allow updating editable fields — stats are managed by event triggers
    const updateData = {
      ...(data.name && { name: data.name.trim() }),
      ...(data.location !== undefined && { location: data.location.trim() }),
      updatedAt: new Date().toISOString(),
    }

    await ref.update(updateData)
    return { id, ...doc.data(), ...updateData }
  }

  async deleteBranch(id) {
    const ref = db.collection(COLLECTIONS.BRANCH).doc(id)
    const doc = await ref.get()
    if (!doc.exists) throw new Error('Branch not found')

    await ref.delete()
    return { id, message: 'Branch deleted successfully' }
  }

  /**
   * Returns a minimal branch snapshot for embedding in Student records.
   */
  getBranchSnapshot(id, data) {
    if (!id || !data) return null
    return { id, name: data.name, abbr: data.abbr }
  }

  /**
   * Recalculates and persists all stats for a single branch.
   * Optimized to use filtered queries instead of fetching full collections.
   */
  async calculateAndSyncStats(branchId) {
    if (!branchId) return
    const today = new Date().toISOString().split('T')[0]

    // Build optimized queries
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
      const status = (data.paymentStatus || '').toLowerCase()
      const amount = data.amount || 0

      if (['paid', 'confirmed', 'active', 'success'].includes(status)) {
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

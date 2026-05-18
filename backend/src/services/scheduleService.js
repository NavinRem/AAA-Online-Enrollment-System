const { db, COLLECTIONS } = require('../config/database')
const { validateSchedule, validateUpdateSchedule } = require('../validators/scheduleValidator')

class ScheduleService {
  async createSchedule(scheduleData) {
    const validatedData = validateSchedule(scheduleData)
    await this.ensureUnique(validatedData.day, validatedData.time)

    const docRef = await db.collection(COLLECTIONS.SCHEDULE).add(validatedData)
    return { id: docRef.id, ...validatedData }
  }

  async getAllSchedules() {
    const snapshot = await db.collection(COLLECTIONS.SCHEDULE).get()
    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((s) => s.isDeleted !== true)
      .sort((a, b) => `${a.day} ${a.time}`.localeCompare(`${b.day} ${b.time}`))
  }

  async getSchedule(id) {
    if (!id) throw new Error('Schedule ID is required')
    const doc = await db.collection(COLLECTIONS.SCHEDULE).doc(id).get()
    if (!doc.exists || doc.data().isDeleted) throw new Error('Schedule not found')
    return { id: doc.id, ...doc.data() }
  }

  async updateSchedule(id, data) {
    if (!id) throw new Error('Schedule ID is required')
    const validatedData = validateUpdateSchedule(data)
    const ref = db.collection(COLLECTIONS.SCHEDULE).doc(id)
    const doc = await ref.get()

    if (!doc.exists || doc.data().isDeleted) throw new Error('Schedule not found')

    const next = { ...doc.data(), ...validatedData }
    if (validatedData.day || validatedData.time) {
      await this.ensureUnique(next.day, next.time, id)
    }

    await ref.update(validatedData)
    await this.syncReferences(id, { id, ...next })
    return { id, ...validatedData }
  }

  async deleteSchedule(id) {
    if (!id) throw new Error('Schedule ID is required for deletion')
    const ref = db.collection(COLLECTIONS.SCHEDULE).doc(id)
    const doc = await ref.get()
    if (!doc.exists) throw new Error('Schedule not found')

    await ref.update({
      isDeleted: true,
      status: 'deleted',
      updatedAt: new Date().toISOString(),
    })

    return { message: 'Schedule deleted successfully (Soft delete)' }
  }

  getScheduleSnapshot(id, data) {
    if (!id || !data) return null
    return {
      id,
      day: data.day,
      time: data.time,
    }
  }

  async ensureUnique(day, time, ignoreId = null) {
    const snapshot = await db.collection(COLLECTIONS.SCHEDULE).get()
    const exists = snapshot.docs.some((doc) => {
      if (doc.id === ignoreId) return false
      const data = doc.data()
      return data.isDeleted !== true &&
        String(data.day).toLowerCase() === String(day).toLowerCase() &&
        String(data.time).toLowerCase() === String(time).toLowerCase()
    })

    if (exists) throw new Error(`Schedule "${day} ${time}" already exists`)
  }

  async syncReferences(scheduleId, scheduleData) {
    const schedule = this.getScheduleSnapshot(scheduleId, scheduleData)
    const classSnap = await db
      .collection(COLLECTIONS.CLASS)
      .where('scheduleIds', 'array-contains', scheduleId)
      .get()

    const writes = []
    classSnap.forEach((doc) => {
      const data = doc.data()
      const schedules = (data.schedules || []).map((s) => s.id === scheduleId ? schedule : s)
      writes.push({ ref: doc.ref, data: { schedules, updatedAt: new Date().toISOString() } })
    })

    const termSnap = await db.collection(COLLECTIONS.TERM).get()
    termSnap.forEach((doc) => {
      const data = doc.data()
      const offeringsArray = Array.isArray(data.offerings)
        ? data.offerings
        : (data.offerings && typeof data.offerings === 'object' ? Object.values(data.offerings) : []);

      const offerings = offeringsArray.map((offering) =>
        offering.scheduleId === scheduleId ? { ...offering, schedule } : offering
      )
      if (JSON.stringify(offerings) !== JSON.stringify(data.offerings || [])) {
        writes.push({ ref: doc.ref, data: { offerings, updatedAt: new Date().toISOString() } })
      }
    })

    if (writes.length > 0) {
      const firestoreHelper = require('../utils/firestoreHelper')
      await firestoreHelper.chunkedUpdate(writes)
    }
  }
}

module.exports = new ScheduleService()

const { db, COLLECTIONS } = require('../config/database')
const profileHelper = require('../utils/profileHelper')
const {
  validateProgram,
  validateUpdateProgram,
} = require('../validators/programValidator')

class ProgramService {
  async createProgram(programData) {
    const validated = validateProgram(programData)
    const { categoryId, levelId } = validated

    const categoryRef = db.collection(COLLECTIONS.CATEGORY).doc(categoryId)
    const levelRef = db.collection(COLLECTIONS.LEVEL).doc(levelId)

    const [categoryDoc, levelDoc] = await Promise.all([
      categoryRef.get(),
      levelRef.get(),
    ])

    if (!categoryDoc.exists) throw new Error('Category not found')
    if (!levelDoc.exists) throw new Error('Level not found')

    const programId = db.collection(COLLECTIONS.PROGRAM).doc().id

    const cleanData = {
      name: validated.name,
      categoryId: categoryDoc.id,
      levelId: levelDoc.id,
      category: categoryDoc.data().name,
      level: levelDoc.data().name,
      categoryInfo: profileHelper.getCategorySnapshot(
        categoryId,
        categoryDoc.data(),
      ),
      levelInfo: profileHelper.getLevelSnapshot(levelId, levelDoc.data()),
      description: validated.description,
      totalSessions: validated.totalSessions,
      basePrice: validated.basePrice,
      maxCapacity: validated.maxCapacity,
      type: validated.type,
      profileURL: validated.profileURL,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const snapshot = profileHelper.getProgramSnapshot(programId, cleanData)
    const categoryProgramInfo = [
      ...(categoryDoc.data().programInfo || []),
      snapshot,
    ]
    const levelProgramInfo = [...(levelDoc.data().programInfo || []), snapshot]

    const batch = db.batch()
    batch.set(db.collection(COLLECTIONS.PROGRAM).doc(programId), cleanData)
    batch.update(categoryRef, { programInfo: categoryProgramInfo })
    batch.update(levelRef, { programInfo: levelProgramInfo })

    await batch.commit()
    return { id: programId, ...cleanData }
  }

  async getAllPrograms() {
    const snapshot = await db.collection(COLLECTIONS.PROGRAM).get()
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  }

  async getProgram(id) {
    if (!id) throw new Error('Program ID is required')
    const doc = await db.collection(COLLECTIONS.PROGRAM).doc(id).get()
    if (!doc.exists) throw new Error('Program not found')
    return { id: doc.id, ...doc.data() }
  }

  async updateProgram(id, updateData) {
    if (!id) throw new Error('Program ID is required')
    const validatedUpdate = validateUpdateProgram(updateData)

    const programRef = db.collection(COLLECTIONS.PROGRAM).doc(id)
    const programDoc = await programRef.get()
    if (!programDoc.exists) throw new Error('Program not found')

    const currentProgramData = programDoc.data()
    const categoryId = currentProgramData.categoryId
    const levelId = currentProgramData.levelId

    const cleanUpdate = {
      ...(validatedUpdate.name && { name: validatedUpdate.name }),
      ...(validatedUpdate.categoryId && {
        categoryId: validatedUpdate.categoryId,
      }),
      ...(validatedUpdate.levelId && { levelId: validatedUpdate.levelId }),
      ...(validatedUpdate.category && { category: validatedUpdate.category }),
      ...(validatedUpdate.level && { level: validatedUpdate.level }),
      ...(validatedUpdate.description && {
        description: validatedUpdate.description,
      }),
      ...(validatedUpdate.totalSessions && {
        totalSessions: validatedUpdate.totalSessions,
      }),
      ...(validatedUpdate.basePrice && {
        basePrice: validatedUpdate.basePrice,
      }),
      ...(validatedUpdate.maxCapacity && {
        maxCapacity: validatedUpdate.maxCapacity,
      }),
      ...(validatedUpdate.type && { type: validatedUpdate.type }),
      ...(validatedUpdate.profileURL && {
        profileURL: validatedUpdate.profileURL,
      }),
      updatedAt: new Date().toISOString(),
    }

    const batch = db.batch()
    batch.update(programRef, cleanUpdate)

    const syncFields = [
      'name',
      'categoryId',
      'levelId',
      'category',
      'level',
      'description',
      'totalSessions',
      'basePrice',
      'maxCapacity',
      'type',
      'profileURL',
    ]
    const shouldSync = Object.keys(cleanUpdate).some((k) =>
      syncFields.includes(k),
    )

    if (shouldSync) {
      const [catDoc, levDoc] = await Promise.all([
        db.collection(COLLECTIONS.CATEGORY).doc(categoryId).get(),
        db.collection(COLLECTIONS.LEVEL).doc(levelId).get(),
      ])

      const snapshot = profileHelper.getProgramSnapshot(id, {
        ...currentProgramData,
        ...cleanUpdate,
        category: catDoc.data()?.name || currentProgramData.category,
        level: levDoc.data()?.name || currentProgramData.level,
        categoryInfo: profileHelper.getCategorySnapshot(
          categoryId,
          catDoc.data(),
        ),
        levelInfo: profileHelper.getLevelSnapshot(levelId, levDoc.data()),
      })
      await this.syncProgramMirrors(id, snapshot, categoryId, levelId, batch)
    }

    await batch.commit()
    return { message: 'Updated successfully' }
  }

  async deleteProgram(id) {
    if (!id) throw new Error('Program ID is required for deletion')
    const programRef = db.collection(COLLECTIONS.PROGRAM).doc(id)
    const programDoc = await programRef.get()
    if (!programDoc.exists) throw new Error('Program not found')

    const { categoryId, levelId } = programDoc.data()
    const batch = db.batch()

    batch.delete(programRef)
    await this.clearProgramMirrors(id, categoryId, levelId, batch)

    const enrollmentsSnap = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where('programId', '==', id)
      .get()
    enrollmentsSnap.forEach((doc) => batch.delete(doc.ref))

    await batch.commit()
    return { id, message: 'Program deleted successfully' }
  }

  async syncProgramMirrors(id, snapshot, categoryId, levelId, batch) {
    const categoryRef = db.collection(COLLECTIONS.CATEGORY).doc(categoryId)
    const levelRef = db.collection(COLLECTIONS.LEVEL).doc(levelId)

    const [categoryDoc, levelDoc] = await Promise.all([
      categoryRef.get(),
      levelRef.get(),
    ])

    if (categoryDoc.exists) {
      let categoryProgramInfo = [...(categoryDoc.data().programInfo || [])]
      const index = categoryProgramInfo.findIndex((p) => p.id === id)
      if (index !== -1) {
        categoryProgramInfo[index] = snapshot
      } else {
        categoryProgramInfo.push(snapshot)
      }
      batch.update(categoryRef, { programInfo: categoryProgramInfo })
    }

    if (levelDoc.exists) {
      let levelProgramInfo = [...(levelDoc.data().programInfo || [])]
      const index = levelProgramInfo.findIndex((p) => p.id === id)
      if (index !== -1) {
        levelProgramInfo[index] = snapshot
      } else {
        levelProgramInfo.push(snapshot)
      }
      batch.update(levelRef, { programInfo: levelProgramInfo })
    }

    const enrollmentsSnap = await db
      .collection(COLLECTIONS.ENROLLMENT)
      .where('programId', '==', id)
      .get()
    enrollmentsSnap.forEach((eDoc) =>
      batch.update(eDoc.ref, { programInfo: snapshot }),
    )
  }

  async clearProgramMirrors(id, categoryId, levelId, batch) {
    const categoryRef = db.collection(COLLECTIONS.CATEGORY).doc(categoryId)
    const levelRef = db.collection(COLLECTIONS.LEVEL).doc(levelId)

    const [categoryDoc, levelDoc] = await Promise.all([
      categoryRef.get(),
      levelRef.get(),
    ])

    if (categoryDoc.exists) {
      let programInfo = [...(categoryDoc.data().programInfo || [])]
      programInfo = programInfo.filter((p) => p.id !== id)
      batch.update(categoryRef, { programInfo })
    }

    if (levelDoc.exists) {
      let programInfo = [...(levelDoc.data().programInfo || [])]
      programInfo = programInfo.filter((p) => p.id !== id)
      batch.update(levelRef, { programInfo })
    }
  }

  async syncProgramsWithCategory(categoryId, categoryName) {
    const snapshot = await db
      .collection(COLLECTIONS.PROGRAM)
      .where('categoryId', '==', categoryId)
      .get()

    if (snapshot.empty) return

    const batch = db.batch()
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        category: categoryName,
        updatedAt: new Date().toISOString(),
      })
    })
    await batch.commit()

    for (const doc of snapshot.docs) {
      const programData = { ...doc.data(), category: categoryName }
      const classService = require('./classService')
      const programSnapshot = profileHelper.getProgramSnapshot(
        doc.id,
        programData,
      )
      await classService.syncClassesWithProgram(doc.id, programSnapshot)
    }
  }

  async _commitInChunks(writes, incomingBatch = null) {
    if (incomingBatch) {
      writes.forEach(({ ref, data }) => incomingBatch.update(ref, data))
      return
    }

    const CHUNK_SIZE = 400
    for (let i = 0; i < writes.length; i += CHUNK_SIZE) {
      const batch = db.batch()
      writes
        .slice(i, i + CHUNK_SIZE)
        .forEach(({ ref, data }) => batch.update(ref, data))
      await batch.commit()
    }
  }
}

module.exports = new ProgramService()

const { db, COLLECTIONS } = require('../src/config/database')
const termService = require('../src/services/termService')

async function cleanup() {
  console.log('--- Starting Term Data Cleanup & Sanitization ---')
  console.log('Database Connected:', !!db)

  try {
    // 1. Fetch all terms including deleted ones
    console.log('Fetching all terms...')
    const termsSnap = await db.collection(COLLECTIONS.TERM).get()
    const allTerms = termsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    console.log(`Total terms found in emulator: ${allTerms.length}`)

    // 2. HARD DELETE already soft-deleted terms to clean up clutter
    const deletedTerms = allTerms.filter(
      (t) => t.isDeleted === true || t.status === 'deleted',
    )
    if (deletedTerms.length > 0) {
      console.log(`Deleting ${deletedTerms.length} soft-deleted records...`)
      const batch = db.batch()
      deletedTerms.forEach((t) =>
        batch.delete(db.collection(COLLECTIONS.TERM).doc(t.id)),
      )
      await batch.commit()
      console.log('Clutter removed.')
    } else {
      console.log('No clutter (soft-deleted terms) found.')
    }

    // 3. Refresh list of active terms
    const activeTermsSnap = await db.collection(COLLECTIONS.TERM).get()
    const activeTerms = activeTermsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    console.log(`Active terms to process: ${activeTerms.length}`)

    // 4. Merge Duplicates (Same name, different branches)
    const groups = {}
    activeTerms.forEach((t) => {
      const key = t.name.trim()
      if (!groups[key]) groups[key] = []
      groups[key].push(t)
    })

    for (const name in groups) {
      const termGroup = groups[name]
      if (termGroup.length <= 1) continue

      console.log(
        `\nMerging duplicate group for "${name}" (${termGroup.length} records)`,
      )

      // Sort by offerings length to pick a good master
      termGroup.sort(
        (a, b) => (b.offerings?.length || 0) - (a.offerings?.length || 0),
      )
      const master = termGroup[0]
      const others = termGroup.slice(1)

      const mergedBranchIds = [
        ...new Set([
          ...(master.branchIds || (master.branchId ? [master.branchId] : [])),
        ]),
      ]
      const mergedSettings = [...(master.branchSettings || [])]
      let mergedOfferings = [...(master.offerings || [])]

      for (const other of others) {
        console.log(`  Merging ID: ${other.id} into MASTER: ${master.id}`)

        const otherBranchIds =
          other.branchIds || (other.branchId ? [other.branchId] : [])
        otherBranchIds.forEach((bid) => {
          if (!mergedBranchIds.includes(bid)) {
            mergedBranchIds.push(bid)
            const otherSetting = (other.branchSettings || []).find(
              (s) => s.branchId === bid,
            )
            mergedSettings.push(
              otherSetting || {
                branchId: bid,
                startDate: other.startDate || master.startDate,
                endDate: other.endDate || master.endDate,
                status: other.status || master.status || 'upcoming',
              },
            )
          }
        })

        // Merge offerings
        const otherOfferings = other.offerings || []
        otherOfferings.forEach((off) => {
          if (!mergedOfferings.find((m) => m.offeringId === off.offeringId)) {
            mergedOfferings.push(off)
          }
        })

        // Update enrollments
        const enrollSnap = await db
          .collection(COLLECTIONS.ENROLLMENT)
          .where('termId', '==', other.id)
          .get()
        if (!enrollSnap.empty) {
          console.log(`    Updating ${enrollSnap.size} enrollments...`)
          const batch = db.batch()
          enrollSnap.forEach((doc) => {
            batch.update(doc.ref, {
              termId: master.id,
              'term.id': master.id,
              'class.term.id': master.id,
            })
          })
          await batch.commit()
        }

        // Hard delete redundant
        await db.collection(COLLECTIONS.TERM).doc(other.id).delete()
      }

      await db.collection(COLLECTIONS.TERM).doc(master.id).update({
        branchIds: mergedBranchIds,
        branchSettings: mergedSettings,
        offerings: mergedOfferings,
        updatedAt: new Date().toISOString(),
      })
    }

    // 5. Final Sanitation
    const finalSnap = await db.collection(COLLECTIONS.TERM).get()
    for (const doc of finalSnap.docs) {
      const t = doc.data()
      const bIds = t.branchIds || (t.branchId ? [t.branchId] : [])
      if (bIds.length > 0) {
        const settings = t.branchSettings || []
        const missingIds = bIds.filter(
          (id) => !settings.find((s) => s.branchId === id),
        )

        if (missingIds.length > 0) {
          missingIds.forEach((id) => {
            settings.push({
              branchId: id,
              startDate: t.startDate || new Date().toISOString().split('T')[0],
              endDate: t.endDate || new Date().toISOString().split('T')[0],
              status: t.status || 'upcoming',
            })
          })
          await doc.ref.update({ branchSettings: settings })
          console.log(`Sanitized branchSettings for: ${t.name}`)
        }
      }
    }

    console.log('\n--- Cleanup Complete Successfully ---')
  } catch (err) {
    console.error('\n!!! Cleanup Failed !!!')
    console.error(err)
    process.exit(1)
  }
  process.exit(0)
}

cleanup()

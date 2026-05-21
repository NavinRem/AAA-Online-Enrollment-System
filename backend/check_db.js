const admin = require('firebase-admin')
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'
admin.initializeApp({ projectId: 'demo-aaa-online-enrollment' })

const db = admin.firestore()

async function checkTerms() {
  const termsSnap = await db.collection('terms').get()
  console.log('Total terms:', termsSnap.size)
  termsSnap.forEach((doc) => {
    const data = doc.data()
    console.log(
      `Term ID: ${doc.id}, Name: ${data.name}, Start: ${data.startDate}`,
    )
    if (data.offerings && data.offerings.length > 0) {
      console.log(`  Offerings count: ${data.offerings.length}`)
      data.offerings.forEach((off, idx) => {
        console.log(
          `    Off ${idx}: classId=${off.classId}, branchId=${off.branchId}, progName=${off.program?.name}`,
        )
      })
    }
  })

  const classesSnap = await db.collection('classes').get()
  console.log('\nTotal classes:', classesSnap.size)
  classesSnap.forEach((doc) => {
    const data = doc.data()
    console.log(
      `Class ID: ${doc.id}, ProgName: ${data.program?.name}, SchedCount: ${data.scheduleIds?.length || 0}`,
    )
  })
}

checkTerms().catch(console.error)

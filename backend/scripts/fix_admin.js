const { getAuth } = require('firebase-admin/auth')
const { db, COLLECTIONS } = require('../src/config/database')

async function fixAdmin() {
  try {
    const listUsersResult = await getAuth().listUsers()
    const users = listUsersResult.users

    if (users.length === 0) {
      console.log('No users found in Authentication emulator.')
      return
    }

    for (const user of users) {
      const adminRef = db.collection(COLLECTIONS.ADMIN).doc(user.uid)
      const adminDoc = await adminRef.get()

      if (!adminDoc.exists) {
        console.log(`Creating admin document for ${user.email || 'no-email'} (${user.uid})`)

        await adminRef.set({
          name: user.displayName || 'Admin User',
          email: user.email || 'admin@example.com',
          profileURL: user.photoURL || null,
          status: 'active',
          role: 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          mustChangePassword: false,
        })

        // Also set custom claims
        await getAuth().setCustomUserClaims(user.uid, { role: 'admin' })

        console.log(`Successfully created admin document and claims for ${user.email || user.uid}`)
      } else {
        console.log(`Admin document already exists for ${user.email || user.uid}`)
      }
    }
    console.log('Done.')
    process.exit(0)
  } catch (error) {
    console.error('Error fixing admin:', error)
    process.exit(1)
  }
}

fixAdmin()

const authService = require('../services/authService')
const { COLLECTIONS } = require('../config/database')

/**
 * Convenience script to ensure the default admin exists in Firebase Auth.
 * Run this via: node src/scripts/initAdmin.js
 */
async function initAdmin() {
  console.log('🚀 Initializing Admin Auth Account...')

  const adminData = {
    name: 'Super Admin',
    email: 'admin@academy.com',
    password: 'AAA123456',
    role: 'admin',
    status: 'active',
  }

  try {
    const result = await authService.registerAccount(
      adminData,
      'admin',
      COLLECTIONS.ADMIN,
    )
    console.log('✅ Admin initialized successfully!')
    console.log('📧 Email:', adminData.email)
    console.log('🔑 Password:', adminData.password)
    console.log('🆔 Auth UID:', result.id)
    process.exit(0)
  } catch (error) {
    console.error('❌ Failed to initialize admin:', error.message)
    process.exit(1)
  }
}

initAdmin()

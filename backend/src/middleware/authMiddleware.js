const admin = require('firebase-admin')
const logger = require('firebase-functions/logger')
require('../config/database') // Ensures Firebase is initialized and emulators configured
const { auditStore } = require('../utils/auditContext')

const adminNameCache = new Map()

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required. No token provided.',
    })
  }

  const idToken = authHeader.split('Bearer ')[1]

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    req.user = decodedToken

    let adminName = decodedToken.name || decodedToken.displayName
    let adminEmail = decodedToken.email || null
    let adminRole = decodedToken.role || 'admin'
    let adminProfileURL = decodedToken.picture || null
    let adminBranch = decodedToken.branch || null

    try {
      const { db, COLLECTIONS } = require('../config/database')
      const cached = adminNameCache.get(decodedToken.uid)
      let docData = null
      if (cached && Date.now() - cached.cachedAt < 5000) {
        docData = cached.data
      } else {
        const doc = await db
          .collection(COLLECTIONS.ADMIN)
          .doc(decodedToken.uid)
          .get()
        if (doc.exists) {
          docData = doc.data()
          adminNameCache.set(decodedToken.uid, {
            data: docData,
            cachedAt: Date.now(),
          })
        }
      }
      if (docData) {
        if (docData.name) adminName = docData.name
        if (docData.email) adminEmail = docData.email
        if (docData.role) adminRole = docData.role
        if (docData.profileURL) adminProfileURL = docData.profileURL
        if (docData.branch) adminBranch = docData.branch
      }
    } catch (e) {
      logger.error('Admin profile lookup failed:', {
        message: e.message,
        code: e.code,
      })
    }

    if (!adminName) {
      adminName = adminEmail ? adminEmail.split('@')[0] : 'Admin User'
    }

    let action = 'Edited Details'
    if (req.method === 'POST') {
      action = 'Created Record'
    } else if (req.method === 'DELETE') {
      action = 'Deleted / Cancelled'
    } else if (req.method === 'PUT' || req.method === 'PATCH') {
      const pathStr = (req.originalUrl || req.path || '').toLowerCase()
      if (pathStr.includes('/transfer')) {
        action = 'Transferred Class'
      } else if (req.body && req.body.status) {
        const sLower = String(req.body.status).toLowerCase()
        if (sLower.includes('cancel') || sLower.includes('drop')) {
          action = 'Cancelled Enrollment'
        } else {
          action = `Status -> ${req.body.status}`
        }
      } else if (req.body && req.body.paymentStatus) {
        action = `Payment -> ${req.body.paymentStatus}`
      }
    }

    const snapshot = {
      uid: decodedToken.uid || 'unknown',
      name: adminName,
      email: adminEmail,
      role: adminRole,
      branch: adminBranch,
      profileURL: adminProfileURL || null,
      action,
      timestamp: new Date().toISOString(),
    }
    req.adminSnapshot = snapshot

    return auditStore.run(snapshot, () => {
      next()
    })
  } catch (error) {
    logger.error('Token verification failed:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    })
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Session expired or invalid token. Please log in again.',
    })
  }
}

const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access Denied: Administrative privileges required.',
    })
  }
  next()
}

/**
 * Ensures the logged-in user is either the owner of the account (by UID) or an admin.
 * Primarily used for /auth/profile/:uid routes.
 */
const isOwnerOrAdmin = (req, res, next) => {
  const targetUid = req.params.uid
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required.',
    })
  }

  const isOwner = req.user.uid === targetUid
  const isAdminUser = req.user.role === 'admin'

  if (isOwner || isAdminUser) {
    next()
  } else {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access Denied: You can only access your own profile.',
    })
  }
}

const clearAdminCache = (uid) => {
  if (uid) {
    adminNameCache.delete(uid)
  } else {
    adminNameCache.clear()
  }
}

const isParent = (req, res, next) => {
  if (!req.user || req.user.role !== 'parent') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access Denied: Parent account required.',
    })
  }
  next()
}

module.exports = {
  verifyToken,
  isAdmin,
  isOwnerOrAdmin,
  isParent,
  clearAdminCache,
}

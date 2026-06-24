const admin = require('firebase-admin')
const logger = require('firebase-functions/logger')
require('../config/database') // Ensures Firebase is initialized and emulators configured
 // Ensures Firebase is initialized and emulators configured

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
    next()
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

module.exports = {
  verifyToken,
  isAdmin,
  isOwnerOrAdmin,
}

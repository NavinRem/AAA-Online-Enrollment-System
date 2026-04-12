const admin = require('firebase-admin')
const logger = require('firebase-functions/logger')

/**
 * Middleware to verify Firebase ID Token from Authorization header
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'No authentication token provided',
    })
  }

  const idToken = authHeader.split('Bearer ')[1]

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    req.user = decodedToken
    next()
  } catch (error) {
    logger.error('Token verification failed:', error.message)
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired authentication token',
    })
  }
}

/**
 * Middleware to check for Admin role (Full Management Access)
 */
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access Denied: Only administrators can access this portal.',
    })
  }
  next()
}

/**
 * Middleware to check for Staff/Admin role (Web Portal Access)
 */
const isStaff = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'staff')) {
    return res.status(403).json({
      error: 'Forbidden',
      message:
        'Access Denied: Only staff members and administrators can access this portal.',
    })
  }
  next()
}

/**
 * Middleware to ensure the user is accessing their own data or is Admin
 * Usage: path parameter must be called :uid
 */
const isOwnerOrAdmin = (req, res, next) => {
  const targetUid = req.params.uid
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' })

  if (req.user.uid === targetUid || req.user.role === 'admin') {
    next()
  } else {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have permission to access this resource',
    })
  }
}

module.exports = {
  verifyToken,
  isAdmin,
  isStaff,
  isOwnerOrAdmin,
}

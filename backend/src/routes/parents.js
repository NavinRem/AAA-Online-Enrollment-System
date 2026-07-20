const express = require('express')
const router = express.Router()
const parentController = require('../controllers/parentController')
const {
  verifyToken,
  isAdmin,
  isOwnerOrAdmin,
  isParent,
} = require('../middleware/authMiddleware')
const { registrationLimiter } = require('../config/limiters')

// ── PUBLIC — no token required ──
router.post(
  '/register',
  registrationLimiter,
  parentController.registerParentSelf,
)

// ── AUTHENTICATED — token required, but role checked per-route below ──
router.use(verifyToken)

// Parent self-service routes FIRST — specific paths must come before the :uid wildcard
router.get('/me', isParent, parentController.getMyProfile)
router.get('/my-children', isParent, parentController.getMyChildren)
router.get('/my-enrollments', isParent, parentController.getMyEnrollments)
router.get(
  '/attendance/:studentId',
  isParent,
  parentController.getMyChildAttendance,
)
router.get('/classes/available', isParent, parentController.getAvailableClasses)
router.post('/self-enroll', isParent, parentController.selfEnroll)
router.post(
  '/upload-payment-proof/:enrollmentId',
  isParent,
  parentController.uploadPaymentProof,
)

// Admin-managed parent CRUD — wildcard /:uid must come AFTER specific paths above
router.get('/', isAdmin, parentController.getAllParents)
router.get('/:uid', isOwnerOrAdmin, parentController.getParent)
router.post('/', isAdmin, registrationLimiter, parentController.createParent)
router.patch('/:uid', isOwnerOrAdmin, parentController.updateParent)
router.delete('/:uid', isAdmin, parentController.deleteParent)
module.exports = router

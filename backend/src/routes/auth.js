const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const {
  verifyToken,
  isAdmin,
  isOwnerOrAdmin,
} = require('../middleware/authMiddleware')

// Public Routes
router.post('/register', authController.register)

// Protected Routes
router.use(verifyToken)

router.get('/me', authController.getMe)
router.get('/role/:uid', authController.getUserRole)
router.get('/profile/:uid', isOwnerOrAdmin, authController.getUser)
router.get('/all', isAdmin, authController.getAllUsers)
router.post('/reset-password/:uid', isAdmin, authController.resetPassword)

module.exports = router

const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const { verifyToken, isAdmin } = require('../middleware/authMiddleware')

router.get('/', verifyToken, isAdmin, userController.getAllUsers)

router.get('/:uid', verifyToken, userController.getUser)
router.get('/:uid/role', verifyToken, userController.getUserRole)
router.post(
  '/:uid/reset-password',
  verifyToken,
  isAdmin,
  userController.resetPassword,
)

router.post(
  '/run-standardization',
  verifyToken,
  isAdmin,
  userController.runStandardization,
)

module.exports = router

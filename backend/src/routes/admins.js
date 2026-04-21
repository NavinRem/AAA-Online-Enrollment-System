const express = require('express')
const router = express.Router()
const adminController = require('../controllers/adminController')
const { verifyToken, isAdmin } = require('../middleware/authMiddleware')
const { registrationLimiter } = require('../config/limiters')

router.post(
  '/register',
  verifyToken,
  isAdmin,
  registrationLimiter,
  adminController.registerAdmin,
)

router.get('/', verifyToken, isAdmin, adminController.getAllAdmins)

router.get('/:id', verifyToken, adminController.getAdmin)

router.patch('/:id', verifyToken, adminController.updateAdmin)

router.delete('/:id', verifyToken, isAdmin, adminController.deleteAdmin)

module.exports = router

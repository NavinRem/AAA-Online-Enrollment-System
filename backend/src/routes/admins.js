const express = require('express')
const router = express.Router()
const adminController = require('../controllers/adminController')
const { verifyToken, isAdmin } = require('../middleware/authMiddleware')
const { registrationLimiter } = require('../config/limiters')

router.use(verifyToken)
router.use(isAdmin)

router.get('/', adminController.getAllAdmins)
router.get('/:id', adminController.getAdmin)
router.post('/', registrationLimiter, adminController.createAdmin)
router.patch('/:id', adminController.updateAdmin)
router.delete('/:id', adminController.deleteAdmin)

module.exports = router

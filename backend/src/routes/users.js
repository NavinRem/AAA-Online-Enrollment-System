const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const { verifyToken, isAdmin } = require('../middleware/authMiddleware')

router.use(verifyToken)

router.get('/', isAdmin, userController.getAllUsers)
router.get('/:uid', userController.getUser)
router.get('/:uid/role', userController.getUserRole)

router.post('/:uid/reset-password', isAdmin, userController.resetPassword)
router.post('/run-standardization', isAdmin, userController.runStandardization)

module.exports = router

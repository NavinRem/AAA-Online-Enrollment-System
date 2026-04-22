const express = require('express')
const router = express.Router()
const parentController = require('../controllers/parentController')
const { verifyToken, isAdmin, isOwnerOrAdmin } = require('../middleware/authMiddleware')
const { registrationLimiter } = require('../config/limiters')

router.use(verifyToken)

router.get('/', isAdmin, parentController.getAllParents)
router.get('/:uid', isOwnerOrAdmin, parentController.getParent)
router.post('/', isAdmin, registrationLimiter, parentController.createParent)
router.patch('/:uid', isOwnerOrAdmin, parentController.updateParent)
router.delete('/:uid', isAdmin, parentController.deleteParent)

module.exports = router

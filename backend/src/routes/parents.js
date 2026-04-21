const express = require('express')
const router = express.Router()
const parentController = require('../controllers/parentController')
const { verifyToken, isAdmin } = require('../middleware/authMiddleware')
const { registrationLimiter } = require('../config/limiters')

router.post('/', registrationLimiter, parentController.createParent)
router.get('/', verifyToken, isAdmin, parentController.getAllParents)
router.get('/:id', verifyToken, parentController.getParent)
router.patch('/:id', verifyToken, parentController.updateParent)
router.delete('/:id', verifyToken, parentController.deleteParent)
module.exports = router

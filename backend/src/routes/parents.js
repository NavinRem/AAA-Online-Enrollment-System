const express = require('express')
const router = express.Router()
const parentController = require('../controllers/parentController')
const { verifyToken, isAdmin } = require('../middleware/authMiddleware')
const { registrationLimiter } = require('../config/limiters')

router.use(verifyToken)

router.get('/', isAdmin, parentController.getAllParents)
router.get('/:id', parentController.getParent)
router.post('/', registrationLimiter, parentController.createParent)
router.patch('/:id', parentController.updateParent)
router.delete('/:id', parentController.deleteParent)

module.exports = router

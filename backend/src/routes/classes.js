const express = require('express')
const router = express.Router()
const classController = require('../controllers/classController')
const { verifyToken, isAdmin } = require('../middleware/authMiddleware')

router.use(verifyToken)

router.get('/', classController.getAllClasses)
router.get('/:id', classController.getClass)
router.get('/:id/validate-capacity', classController.validateCapacity)

router.post('/', isAdmin, classController.createClass)
router.patch('/:id', isAdmin, classController.updateClass)
router.delete('/:id', isAdmin, classController.deleteClass)

router.post('/duplicate', isAdmin, classController.duplicateClasses)
router.post('/:id/sync', isAdmin, classController.syncCount)
router.post('/sync-all', isAdmin, classController.syncAllCounts)

module.exports = router

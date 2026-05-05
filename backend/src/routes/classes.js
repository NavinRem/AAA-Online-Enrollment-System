const express = require('express')
const router = express.Router()
const classController = require('../controllers/classController')
const { verifyToken, isAdmin } = require('../middleware/authMiddleware')

router.use(verifyToken)

// --- CRUD Operations ---
router.post('/', isAdmin, classController.createClass)
router.get('/', classController.getAllClasses)
router.get('/:id', classController.getClass)
router.patch('/:id', isAdmin, classController.updateClass)
router.delete('/:id', isAdmin, classController.deleteClass)

// --- Specialized Actions ---
router.get('/:id/validate-capacity', classController.validateCapacity)
router.post('/duplicate', isAdmin, classController.duplicateClasses)
router.post('/duplicate-selective', isAdmin, classController.duplicateSpecificClasses)
router.post('/:id/sync', isAdmin, classController.syncCount)
router.post('/sync-all', isAdmin, classController.syncAllCounts)

module.exports = router

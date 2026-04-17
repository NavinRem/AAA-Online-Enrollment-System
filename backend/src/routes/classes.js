const express = require('express')
const router = express.Router()
const classController = require('../controllers/classController')
const { verifyToken, isAdmin } = require('../middleware/authMiddleware')

// Bulk Operations
router.post(
  '/duplicate',
  verifyToken,
  isAdmin,
  classController.duplicateClasses,
)

// CRUD
router.post('/', verifyToken, isAdmin, classController.createClass)
router.get('/', verifyToken, classController.getAllClasses)
router.get('/:id', verifyToken, classController.getClass)
router.patch('/:id', verifyToken, isAdmin, classController.updateClass)
router.delete('/:id', verifyToken, isAdmin, classController.deleteClass)

// Operational/Syncing
router.get('/:id/validate-capacity', verifyToken, classController.validateCapacity)
router.post('/:id/sync', verifyToken, isAdmin, classController.syncCount)
router.post('/sync-all', verifyToken, isAdmin, classController.syncAllCounts)

module.exports = router

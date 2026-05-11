const express = require('express')
const router = express.Router()
const scheduleController = require('../controllers/scheduleController')
const { verifyToken, isAdmin } = require('../middleware/authMiddleware')

router.use(verifyToken)

router.get('/', scheduleController.getAllSchedules)
router.get('/:id', scheduleController.getSchedule)
router.post('/', isAdmin, scheduleController.createSchedule)
router.patch('/:id', isAdmin, scheduleController.updateSchedule)
router.delete('/:id', isAdmin, scheduleController.deleteSchedule)

module.exports = router

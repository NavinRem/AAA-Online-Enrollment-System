const express = require('express')
const router = express.Router()
const attendanceController = require('../controllers/attendanceController')
const { verifyToken } = require('../middleware/authMiddleware')

router.use(verifyToken)

router.get('/:classId', attendanceController.getClassAttendance)
router.post('/record', attendanceController.recordAttendance)

module.exports = router

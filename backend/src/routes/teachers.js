const express = require('express')
const router = express.Router()
const teacherController = require('../controllers/teacherController')
const { verifyToken, isAdmin } = require('../middleware/authMiddleware')
const { registrationLimiter } = require('../config/limiters')

router.use(verifyToken)
router.use(isAdmin)

router.get('/', teacherController.getAllTeachers)
router.get('/:id', teacherController.getTeacher)
router.post('/', registrationLimiter, teacherController.createTeacher)
router.patch('/:id', teacherController.updateTeacher)
router.delete('/:id', teacherController.deleteTeacher)

module.exports = router

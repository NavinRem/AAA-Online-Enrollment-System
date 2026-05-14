const express = require('express')
const router = express.Router()
const teacherController = require('../controllers/teacherController')
const { verifyToken, isAdmin } = require('../middleware/authMiddleware')
const { registrationLimiter } = require('../config/limiters')

router.use(verifyToken)
router.use(isAdmin)

router.post('/', registrationLimiter, teacherController.createTeacher)
router.get('/', teacherController.getAllTeachers)
router.get('/:id', teacherController.getTeacher)
router.patch('/:id', teacherController.updateTeacher)
router.delete('/:id', teacherController.deleteTeacher)

// Assignments
router.get('/:id/assignments', teacherController.getAssignments)
router.post('/:id/assign', teacherController.assignToClass)
router.post('/:id/unassign', teacherController.unassignFromClass)

module.exports = router

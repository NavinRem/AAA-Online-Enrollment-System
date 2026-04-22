const express = require('express')
const router = express.Router()
const teacherController = require('../controllers/teacherController')
const { verifyToken, isAdmin } = require('../middleware/authMiddleware')
const { registrationLimiter } = require('../config/limiters')

router.use(verifyToken)

router.get('/', isAdmin, teacherController.getAllTeachers)
router.get('/:id', teacherController.getTeacher)
router.post(
  '/register',
  isAdmin,
  registrationLimiter,
  teacherController.createTeacher,
)
router.patch('/:id', isAdmin, teacherController.updateTeacher)
router.delete('/:id', isAdmin, teacherController.deleteTeacher)

module.exports = router

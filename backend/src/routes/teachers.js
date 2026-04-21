const express = require('express')
const router = express.Router()
const teacherController = require('../controllers/teacherController')
const { verifyToken, isAdmin } = require('../middleware/authMiddleware')
const { registrationLimiter } = require('../config/limiters')

// Admin Only: Register new staff (Teacher)
router.post('/register', verifyToken, isAdmin, registrationLimiter, teacherController.registerTeacher)

// Admin Only: Get all teachers
router.get('/', verifyToken, isAdmin, teacherController.getAllTeachers)

// Get Teacher by ID
router.get('/:id', verifyToken, teacherController.getTeacher)

// Update Teacher
router.patch('/:id', verifyToken, teacherController.updateTeacher)

// Delete Teacher
router.delete('/:id', verifyToken, isAdmin, teacherController.deleteTeacher)

module.exports = router

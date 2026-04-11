const express = require('express')
const router = express.Router()
const studentController = require('../controllers/studentController')

const { verifyToken, isAdmin } = require('../middleware/authMiddleware')

// Create Student
router.post('/', verifyToken, studentController.createStudent)

// Get Student by ID
router.get('/:id', verifyToken, studentController.getStudent)

// Update Student (General)
router.patch('/:id', verifyToken, studentController.updateStudent)

// Update Medical Info (Specific)
router.patch('/:id/medical', verifyToken, studentController.updateMedicalInfo)

// Get Students by Parent ID
router.get(
  '/parent/:parentId',
  verifyToken,
  studentController.getStudentsByParentID,
)

// Get ALL Students
router.get('/', verifyToken, isAdmin, studentController.getAllStudents)

module.exports = router

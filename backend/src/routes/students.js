const express = require('express')
const router = express.Router()
const studentController = require('../controllers/studentController')

const { verifyToken, isAdmin } = require('../middleware/authMiddleware')

router.post('/', verifyToken, studentController.createStudent)
router.get('/', verifyToken, isAdmin, studentController.getAllStudents)
router.get('/:id', verifyToken, studentController.getStudent)
router.patch('/:id', verifyToken, studentController.updateStudent)
router.get(
  '/parent/:parentId',
  verifyToken,
  studentController.getStudentsByParentID,
)
router.delete('/:id', verifyToken, isAdmin, studentController.deleteStudent)

module.exports = router

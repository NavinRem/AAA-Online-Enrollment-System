const express = require('express')
const router = express.Router()
const studentController = require('../controllers/studentController')
const { verifyToken, isAdmin } = require('../middleware/authMiddleware')

router.use(verifyToken)

router.get('/', isAdmin, studentController.getAllStudents)
router.get('/:id', studentController.getStudent)
router.get('/parent/:parentId', studentController.getStudentsByParentID)

router.post('/', studentController.createStudent)
router.patch('/:id', studentController.updateStudent)
router.delete('/:id', isAdmin, studentController.deleteStudent)

module.exports = router

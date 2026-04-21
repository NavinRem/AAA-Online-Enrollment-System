const express = require('express')
const router = express.Router()
const programController = require('../controllers/programController')
const classController = require('../controllers/classController')
const { verifyToken, isAdmin } = require('../middleware/authMiddleware')

router.post('/', verifyToken, isAdmin, programController.createProgram)
router.get('/', verifyToken, programController.getAllPrograms)
router.get('/:id/classes', verifyToken, classController.getAvailableClasses)
router.get('/:id', verifyToken, programController.getProgram)
router.patch('/:id', verifyToken, isAdmin, programController.updateProgram)
router.delete('/:id', verifyToken, isAdmin, programController.deleteProgram)

module.exports = router

const express = require('express')
const router = express.Router()
const programController = require('../controllers/programController')
const classController = require('../controllers/classController')
const { verifyToken, isAdmin } = require('../middleware/authMiddleware')

router.use(verifyToken)

router.get('/', programController.getAllPrograms)
router.get('/:id', programController.getProgram)
router.get('/:id/classes', classController.getAvailableClasses)

router.post('/', isAdmin, programController.createProgram)
router.patch('/:id', isAdmin, programController.updateProgram)
router.delete('/:id', isAdmin, programController.deleteProgram)

module.exports = router

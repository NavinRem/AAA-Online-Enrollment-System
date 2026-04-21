const express = require('express')
const router = express.Router()
const levelController = require('../controllers/levelController')
const { verifyToken, isAdmin } = require('../middleware/authMiddleware')

router.post('/', verifyToken, isAdmin, levelController.createLevel)
router.get('/', verifyToken, levelController.getAllLevels)
router.get('/:id', verifyToken, levelController.getLevel)
router.patch('/:id', verifyToken, isAdmin, levelController.updateLevel)
router.delete('/:id', verifyToken, isAdmin, levelController.deleteLevel)

module.exports = router

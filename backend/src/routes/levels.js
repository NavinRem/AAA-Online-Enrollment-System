const express = require('express')
const router = express.Router({ mergeParams: true })
const levelController = require('../controllers/levelController')
const { verifyToken, isAdmin } = require('../middleware/authMiddleware')

router.get('/', verifyToken, levelController.getAllLevels)
router.post('/', verifyToken, isAdmin, levelController.createLevel)
router.delete('/:id', verifyToken, isAdmin, levelController.deleteLevel)

module.exports = router

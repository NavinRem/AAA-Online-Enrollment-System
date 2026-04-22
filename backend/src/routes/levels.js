const express = require('express')
const router = express.Router()
const levelController = require('../controllers/levelController')
const { verifyToken, isAdmin } = require('../middleware/authMiddleware')

router.use(verifyToken)

router.get('/', levelController.getAllLevels)
router.get('/:id', levelController.getLevel)
router.post('/', isAdmin, levelController.createLevel)
router.patch('/:id', isAdmin, levelController.updateLevel)
router.delete('/:id', isAdmin, levelController.deleteLevel)

module.exports = router

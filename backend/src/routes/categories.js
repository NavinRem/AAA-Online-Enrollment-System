const express = require('express')
const router = express.Router()
const categoryController = require('../controllers/categoryController')
const { verifyToken, isAdmin } = require('../middleware/authMiddleware')

router.use(verifyToken)

router.get('/', categoryController.getAllCategories)
router.post('/', isAdmin, categoryController.createCategory)
router.delete('/:id', isAdmin, categoryController.deleteCategory)

module.exports = router

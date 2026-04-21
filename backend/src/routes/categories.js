const express = require('express')
const router = express.Router()
const categoryController = require('../controllers/categoryController')
const { verifyToken, isAdmin } = require('../middleware/authMiddleware')

router.get('/', verifyToken, categoryController.getAllCategories)

router.post('/', verifyToken, isAdmin, categoryController.createCategory)

router.delete('/:id', verifyToken, isAdmin, categoryController.deleteCategory)

module.exports = router

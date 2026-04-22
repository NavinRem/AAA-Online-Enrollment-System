const express = require('express')
const router = express.Router()
const termController = require('../controllers/termController')
const { verifyToken, isAdmin } = require('../middleware/authMiddleware')

router.use(verifyToken)

router.get('/', termController.getAllTerms)
router.post('/', isAdmin, termController.createTerm)
router.delete('/:id', isAdmin, termController.deleteTerm)

module.exports = router

const express = require('express')
const router = express.Router()
const termController = require('../controllers/termController')
const { verifyToken, isAdmin } = require('../middleware/authMiddleware')

router.use(verifyToken)

router.get('/', termController.getAllTerms)
router.get('/:id', termController.getTerm)
router.post('/', isAdmin, termController.createTerm)
router.patch('/:id', isAdmin, termController.updateTerm)
router.patch('/:id/offerings/:offeringId', isAdmin, termController.updateTermOffering)
router.delete('/:id', isAdmin, termController.deleteTerm)

module.exports = router

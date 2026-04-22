const express = require('express')
const router = express.Router()
const trialController = require('../controllers/trialController')
const { verifyToken, isAdmin } = require('../middleware/authMiddleware')

router.use(verifyToken)

router.post('/', trialController.createTrial)
router.get('/', isAdmin, trialController.getAllTrials)
router.get('/:id', trialController.getTrial)
router.patch('/:id', isAdmin, trialController.updateTrial)
router.delete('/:id', isAdmin, trialController.deleteTrial)

module.exports = router

const express = require('express')
const router = express.Router()
const paymentController = require('../controllers/paymentController')
const { verifyToken, isOwnerOrAdmin } = require('../middleware/authMiddleware')

router.use(verifyToken)

router.get('/', paymentController.getAllPayments)
router.get('/stats', paymentController.getFinancialStats)
router.get('/history/:uid', isOwnerOrAdmin, paymentController.getPaymentHistory)
router.post('/initiate', paymentController.initiatePayment)
router.post('/verify', paymentController.verifyPayment)

module.exports = router

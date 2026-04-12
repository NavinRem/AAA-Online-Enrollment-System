const express = require('express')
const router = express.Router()
const paymentController = require('../controllers/paymentController')
const { verifyToken, isOwnerOrAdmin } = require('../middleware/authMiddleware')

// All payment routes require authentication
router.use(verifyToken)

router.post('/initiate', paymentController.initiatePayment)
router.post('/verify', paymentController.verifyPayment)
router.get('/history/:uid', isOwnerOrAdmin, paymentController.getPaymentHistory)

module.exports = router

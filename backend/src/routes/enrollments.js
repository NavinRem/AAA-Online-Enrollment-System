const express = require('express')
const router = express.Router()
const enrollmentController = require('../controllers/enrollmentController')
const { verifyToken, isAdmin } = require('../middleware/authMiddleware')

router.use(verifyToken)

// --- CRUD Operations ---
router.post('/', enrollmentController.createEnrollment)
router.get('/', isAdmin, enrollmentController.getAllEnrollments)
router.get('/:id', enrollmentController.getEnrollment)
router.patch('/:id', isAdmin, enrollmentController.updateEnrollment)
router.delete('/:id', isAdmin, enrollmentController.deleteEnrollment)

// --- Specialized Actions ---
router.get('/eligibility/:studentId/:programId', enrollmentController.getStudentEligibility)
router.post('/:id/cancel', enrollmentController.cancelEnrollment)
router.post('/:id/process-payment', enrollmentController.processPayment)

module.exports = router

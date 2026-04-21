const express = require('express')
const router = express.Router()
const enrollmentController = require('../controllers/enrollmentController')
const { verifyToken, isAdmin } = require('../middleware/authMiddleware')

router.use(verifyToken)
// CRUD
router.get('/', isAdmin, enrollmentController.getAllEnrollments)
router.get('/:id', enrollmentController.getEnrollment)
router.post('/', enrollmentController.createEnrollment)
router.patch('/:id', isAdmin, enrollmentController.updateEnrollment)
router.delete('/:id', isAdmin, enrollmentController.deleteEnrollment)

// Special Actions
router.post('/:id/cancel', enrollmentController.cancelEnrollment)
router.get('/eligibility/:studentId/:programId', enrollmentController.getStudentEligibility)
router.post('/createEnrollment', enrollmentController.createEnrollment) // Legacy support

module.exports = router

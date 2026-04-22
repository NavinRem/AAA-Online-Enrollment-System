const express = require('express')
const router = express.Router()
const enrollmentController = require('../controllers/enrollmentController')
const { verifyToken, isAdmin } = require('../middleware/authMiddleware')

router.use(verifyToken)

router.get('/', isAdmin, enrollmentController.getAllEnrollments)
router.get('/:id', enrollmentController.getEnrollment)
router.get('/eligibility/:studentId/:programId', enrollmentController.getStudentEligibility)

router.post('/', enrollmentController.createEnrollment)
router.post('/:id/cancel', enrollmentController.cancelEnrollment)
router.patch('/:id', isAdmin, enrollmentController.updateEnrollment)
router.delete('/:id', isAdmin, enrollmentController.deleteEnrollment)

module.exports = router

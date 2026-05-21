const express = require('express')
const router = express.Router()
const performanceController = require('../controllers/performanceController')
const { verifyToken } = require('../middleware/authMiddleware')

// localized middleware to restrict access to Admins or Teachers
const isStaff = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'teacher')) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access Denied: Teacher or Administrative privileges required.',
    })
  }
  next()
}

router.use(verifyToken)

router.post('/', isStaff, performanceController.createPerformance)
router.get('/student/:studentId', performanceController.getPerformanceByStudent)
router.get('/:id', performanceController.getPerformance)
router.patch('/:id', isStaff, performanceController.updatePerformance)
router.delete('/:id', isStaff, performanceController.deletePerformance)

module.exports = router

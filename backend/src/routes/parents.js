const express = require('express')
const router = express.Router()
const parentController = require('../controllers/parentController')
const { verifyToken, isAdmin } = require('../middleware/authMiddleware')
const { registrationLimiter } = require('../config/limiters')

// Public or Admin can register parents
router.post('/register', registrationLimiter, parentController.registerParent)

// Admin Only: Get all parents
router.get('/', verifyToken, isAdmin, parentController.getAllParents)

// Get Parent by ID
router.get('/:id', verifyToken, parentController.getParent)

// Update Parent
router.patch('/:id', verifyToken, parentController.updateParent)

// Delete Parent
router.delete('/:id', verifyToken, parentController.deleteParent)

// Student Management for Parents
router.post('/:uid/students', verifyToken, parentController.registerStudentProfile)
router.get('/:uid/students', verifyToken, parentController.getStudentsByParentID)

module.exports = router

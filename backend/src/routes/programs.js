const express = require('express')
const router = express.Router()
const programController = require('../controllers/programController')
const classController = require('../controllers/classController')
const { verifyToken, isAdmin } = require('../middleware/authMiddleware')

// Create Program (Admin only)
router.post('/', verifyToken, isAdmin, programController.createProgram)

// Get All Programs
router.get('/', verifyToken, programController.getAllPrograms)

// Get Available Classes for a Program
router.get('/:id/classes', verifyToken, classController.getAvailableClasses)

// Get Single Program
router.get('/:id', verifyToken, programController.getProgram)

// Update/Delete (Manage) (Admin Only)
router.patch('/:id', verifyToken, isAdmin, programController.updateProgram)
router.delete('/:id', verifyToken, isAdmin, programController.deleteProgram)

// Schedule Management
router.post(
  '/:id/schedules',
  verifyToken,
  isAdmin,
  programController.addSchedule,
)
router.get('/:id/schedules', verifyToken, programController.getSchedules)
router.delete(
  '/:id/schedules/:scheduleId',
  verifyToken,
  isAdmin,
  programController.removeSchedule,
)

module.exports = router

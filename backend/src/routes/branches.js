const express = require('express')
const router = express.Router()
const branchController = require('../controllers/branchController')
const { verifyToken, isAdmin } = require('../middleware/authMiddleware')

// Get All Branches
router.get('/', verifyToken, branchController.getAllBranches)

// Get Single Branch
router.get('/:id', verifyToken, branchController.getBranch)

// Create Branch (Admin Only)
router.post('/', verifyToken, isAdmin, branchController.createBranch)

// Update Branch (Admin Only)
router.patch('/:id', verifyToken, isAdmin, branchController.updateBranch)

// Delete Branch (Admin Only)
router.delete('/:id', verifyToken, isAdmin, branchController.deleteBranch)

module.exports = router

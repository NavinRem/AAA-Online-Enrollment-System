const express = require('express')
const router = express.Router()
const branchController = require('../controllers/branchController')
const { verifyToken, isAdmin } = require('../middleware/authMiddleware')

router.get('/', verifyToken, branchController.getAllBranches)
router.get('/:id', verifyToken, branchController.getBranch)
router.post('/', verifyToken, isAdmin, branchController.createBranch)
router.patch('/:id', verifyToken, isAdmin, branchController.updateBranch)
router.delete('/:id', verifyToken, isAdmin, branchController.deleteBranch)

module.exports = router

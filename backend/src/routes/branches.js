const express = require('express')
const router = express.Router()
const branchController = require('../controllers/branchController')
const { verifyToken, isAdmin } = require('../middleware/authMiddleware')

router.use(verifyToken)

router.post('/', isAdmin, branchController.createBranch)
router.get('/', branchController.getAllBranches)
router.get('/:id', branchController.getBranch)
router.patch('/:id', isAdmin, branchController.updateBranch)
router.delete('/:id', isAdmin, branchController.deleteBranch)

module.exports = router

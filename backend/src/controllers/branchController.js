const branchService = require('../services/branchService')

exports.createBranch = async (req, res) => {
  try {
    const result = await branchService.createBranch(req.body)
    res.status(201).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.getAllBranches = async (req, res) => {
  try {
    const branches = await branchService.getAllBranches(req.query)
    res.status(200).json(branches)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getBranch = async (req, res) => {
  try {
    const branch = await branchService.getBranch(req.params.id)
    res.status(200).json(branch)
  } catch (error) {
    res.status(404).json({ error: error.message })
  }
}

exports.updateBranch = async (req, res) => {
  try {
    const result = await branchService.updateBranch(req.params.id, req.body)
    res.status(200).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.deleteBranch = async (req, res) => {
  try {
    const result = await branchService.deleteBranch(req.params.id)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

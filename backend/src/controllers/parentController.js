const parentService = require('../services/parentService')

exports.createParent = async (req, res) => {
  try {
    const result = await parentService.createParent(req.body)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getParent = async (req, res) => {
  try {
    const parent = await parentService.getParent(req.params.id)
    res.status(200).json(parent)
  } catch (error) {
    res.status(404).json({ error: error.message })
  }
}

exports.getAllParents = async (req, res) => {
  try {
    const parents = await parentService.getAllParents({ limit: 1000 })
    res.status(200).json(parents)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.updateParent = async (req, res) => {
  try {
    const result = await parentService.updateParent(req.params.id, req.body)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.deleteParent = async (req, res) => {
  try {
    const result = await parentService.deleteParent(req.params.id)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

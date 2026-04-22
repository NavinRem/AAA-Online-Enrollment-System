const levelService = require('../services/levelService')

exports.createLevel = async (req, res) => {
  try {
    const result = await levelService.createLevel(req.body)
    res.status(201).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.getAllLevels = async (req, res) => {
  try {
    const levels = await levelService.getAllLevels(req.query)
    res.status(200).json(levels)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getLevel = async (req, res) => {
  try {
    const level = await levelService.getLevel(req.params.id)
    res.status(200).json(level)
  } catch (error) {
    res.status(404).json({ error: error.message })
  }
}

exports.updateLevel = async (req, res) => {
  try {
    const result = await levelService.updateLevel(req.params.id, req.body)
    res.status(200).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.deleteLevel = async (req, res) => {
  try {
    const result = await levelService.deleteLevel(req.params.id)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

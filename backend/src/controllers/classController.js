const classService = require('../services/classService')

exports.createClass = async (req, res) => {
  try {
    const result = await classService.createClass(req.body)
    res.status(201).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.getAllClasses = async (req, res) => {
  try {
    const classes = await classService.getAllClasses(req.query)
    res.status(200).json(classes)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getAvailableClasses = async (req, res) => {
  try {
    const { id } = req.params // Program ID
    const filters = { programId: id, status: 'active' }

    const classes = await classService.getAllClasses(filters)
    res.status(200).json(classes)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getClass = async (req, res) => {
  try {
    const classData = await classService.getClass(req.params.id)
    res.status(200).json(classData)
  } catch (error) {
    res.status(404).json({ error: error.message })
  }
}

exports.updateClass = async (req, res) => {
  try {
    const result = await classService.updateClass(req.params.id, req.body)
    res.status(200).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.deleteClass = async (req, res) => {
  try {
    const result = await classService.deleteClass(req.params.id)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// --- Specialized Actions ---


exports.syncCount = async (req, res) => {
  try {
    const result = await classService.syncStudentCount(req.params.id)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.syncAllCounts = async (req, res) => {
  try {
    const result = await classService.syncAllClassCounts()
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.validateCapacity = async (req, res) => {
  try {
    const result = await classService.validateCapacity(req.params.id)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

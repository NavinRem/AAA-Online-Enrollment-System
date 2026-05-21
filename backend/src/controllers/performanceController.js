const performanceService = require('../services/performanceService')

exports.createPerformance = async (req, res) => {
  try {
    const result = await performanceService.createPerformance(
      req.body,
      req.user,
    )
    res.status(201).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.getPerformanceByStudent = async (req, res) => {
  try {
    const result = await performanceService.getPerformanceByStudent(
      req.params.studentId,
      req.user,
    )
    res.status(200).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.getPerformance = async (req, res) => {
  try {
    const result = await performanceService.getPerformance(
      req.params.id,
      req.user,
    )
    res.status(200).json(result)
  } catch (error) {
    res.status(404).json({ error: error.message })
  }
}

exports.updatePerformance = async (req, res) => {
  try {
    const result = await performanceService.updatePerformance(
      req.params.id,
      req.body,
      req.user,
    )
    res.status(200).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.deletePerformance = async (req, res) => {
  try {
    const result = await performanceService.deletePerformance(
      req.params.id,
      req.user,
    )
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

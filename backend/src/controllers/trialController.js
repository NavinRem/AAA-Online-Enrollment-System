const trialService = require('../services/trialService')

exports.createTrial = async (req, res) => {
  try {
    const result = await trialService.createTrial(req.body)
    res.status(201).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getTrial = async (req, res) => {
  try {
    const trial = await trialService.getTrial(req.params.id)
    res.status(200).json(trial)
  } catch (error) {
    res.status(404).json({ error: error.message })
  }
}

exports.getAllTrials = async (req, res) => {
  try {
    const trials = await trialService.getAllTrials(req.query)
    res.status(200).json(trials)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.updateTrial = async (req, res) => {
  try {
    const result = await trialService.updateTrial(req.params.id, req.body)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.deleteTrial = async (req, res) => {
  try {
    const result = await trialService.deleteTrial(req.params.id)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

const termService = require('../services/termService')

exports.createTerm = async (req, res) => {
  try {
    const result = await termService.createTerm(req.body)
    res.status(201).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.getAllTerms = async (req, res) => {
  try {
    const terms = await termService.getAllTerms(req.query)
    res.status(200).json(terms)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getTerm = async (req, res) => {
  try {
    const term = await termService.getTerm(req.params.id)
    res.status(200).json(term)
  } catch (error) {
    res.status(404).json({ error: error.message })
  }
}

exports.updateTerm = async (req, res) => {
  try {
    const result = await termService.updateTerm(req.params.id, req.body)
    res.status(200).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.updateTermOffering = async (req, res) => {
  try {
    const { id, offeringId } = req.params
    const result = await termService.updateTermOffering(id, offeringId, req.body)
    res.status(200).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.deleteTerm = async (req, res) => {
  try {
    const result = await termService.deleteTerm(req.params.id)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

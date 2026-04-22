const paymentService = require('../services/paymentService')

exports.getPaymentHistory = async (req, res) => {
  try {
    const result = await paymentService.getPaymentHistory(req.params.uid)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.initiatePayment = async (req, res) => {
  try {
    const result = await paymentService.initiatePayment(req.body)
    res.status(200).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.verifyPayment = async (req, res) => {
  try {
    const result = await paymentService.verifyPayment(req.body.transactionId)
    res.status(200).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const adminService = require('../services/adminService')

exports.registerAdmin = async (req, res) => {
  try {
    const result = await adminService.registerAdmin(req.body)
    res.status(201).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getAdmin = async (req, res) => {
  try {
    const admin = await adminService.getAdmin(req.params.id)
    res.status(200).json(admin)
  } catch (error) {
    res.status(404).json({ error: error.message })
  }
}

exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await adminService.getAllAdmins()
    res.status(200).json(admins)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.updateAdmin = async (req, res) => {
  try {
    const result = await adminService.updateAdmin(req.params.id, req.body)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.deleteAdmin = async (req, res) => {
  try {
    const result = await adminService.deleteAdmin(req.params.id)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

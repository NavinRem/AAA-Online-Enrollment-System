const authService = require('../services/authService')
const adminService = require('../services/adminService')
const parentService = require('../services/parentService')
const teacherService = require('../services/teacherService')

exports.register = async (req, res) => {
  try {
    const result = await parentService.createParent(req.body)
    res.status(201).json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

exports.getMe = async (req, res) => {
  try {
    const user = await authService.getUser(req.user.uid)
    res.status(200).json(user)
  } catch (error) {
    res.status(404).json({ error: error.message })
  }
}

exports.getUser = async (req, res) => {
  try {
    const user = await authService.getUser(req.params.uid)
    res.status(200).json(user)
  } catch (error) {
    res.status(404).json({ error: error.message })
  }
}

exports.getUserRole = async (req, res) => {
  try {
    const roleData = await authService.getUserRole(req.params.uid)
    res.status(200).json(roleData)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getAllUsers = async (req, res) => {
  try {
    const [admins, parents, teachers] = await Promise.all([
      adminService.getAllAdmins(),
      parentService.getAllParents(),
      teacherService.getAllTeachers(),
    ])
    res.status(200).json([...admins, ...parents, ...teachers])
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.resetPassword = async (req, res) => {
  try {
    const result = await authService.manualPasswordReset(req.params.uid)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
